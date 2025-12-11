"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Truck, Users, AlertCircle, Activity, Calendar, Plus } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts'
import { motion } from 'framer-motion'
import { useAuth } from "@/contexts/auth-context"
import { getClients, getShipments, getGoodsReceived, getActivityLogs, getInventory } from "@/lib/firestore"
import { Client, Shipment, GoodsReceived, ActivityLog, InventoryItem } from "@/lib/types"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from "date-fns"

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const duration = 1000
        const steps = 30
        const stepValue = value / steps
        let current = 0

        const timer = setInterval(() => {
            current += stepValue
            if (current >= value) {
                setCount(value)
                clearInterval(timer)
            } else {
                setCount(Math.floor(current))
            }
        }, duration / steps)

        return () => clearInterval(timer)
    }, [value])

    return <span>{prefix}{count.toLocaleString()}{suffix}</span>
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const
        }
    })
}

export default function DashboardPage() {
    const { user, isAdmin, isSuperAdmin } = useAuth()
    const [clients, setClients] = useState<Client[]>([])
    const [shipments, setShipments] = useState<Shipment[]>([])
    const [received, setReceived] = useState<GoodsReceived[]>([])
    const [activities, setActivities] = useState<ActivityLog[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user, isAdmin, isSuperAdmin])

    const loadData = async () => {
        try {
            // Load base data that all roles can access
            const [clientsData, shipmentsData, receivedData, inventoryData] = await Promise.all([
                getClients(),
                getShipments(),
                getGoodsReceived(),
                getInventory(),
            ])
            setClients(clientsData)
            setShipments(shipmentsData)
            setReceived(receivedData)
            setInventory(inventoryData)

            // Only load activity logs for admin and superAdmin
            if (isAdmin || isSuperAdmin) {
                const activitiesData = await getActivityLogs(5)
                setActivities(activitiesData)
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calculate monthly data from real shipments and received goods
    const monthlyData = useMemo(() => {
        const now = new Date()
        const sixMonthsAgo = subMonths(now, 5)
        const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now })

        return months.map(month => {
            const monthShipments = shipments.filter(s =>
                s.date && isSameMonth(s.date.toDate(), month)
            )
            const monthReceived = received.filter(r =>
                r.dateReceived && isSameMonth(r.dateReceived.toDate(), month)
            )

            const shipmentsCount = monthShipments.reduce((sum, s) => sum + (s.numberOfUnits || 0), 0)
            const receivedCount = monthReceived.reduce((sum, r) => sum + (r.totalUnits || 0), 0)

            return {
                name: format(month, 'MMM'),
                shipments: shipmentsCount,
                received: receivedCount,
            }
        })
    }, [shipments, received])

    // Calculate client distribution from inventory
    const clientDistribution = useMemo(() => {
        const clientMap = new Map<string, number>()

        inventory.forEach(item => {
            const current = clientMap.get(item.clientName) || 0
            clientMap.set(item.clientName, current + item.quantity)
        })

        const total = Array.from(clientMap.values()).reduce((sum, val) => sum + val, 0)

        if (total === 0) return []

        const colors = [
            'hsl(var(--chart-1))',
            'hsl(var(--chart-2))',
            'hsl(var(--chart-3))',
            'hsl(var(--chart-4))',
            'hsl(var(--chart-5))',
        ]

        return Array.from(clientMap.entries())
            .map(([name, value], index) => ({
                name,
                value: Math.round((value / total) * 100),
                color: colors[index % colors.length]
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
    }, [inventory])

    // Calculate stats from real data
    const totalUnits = shipments.reduce((sum, s) => sum + (s.numberOfUnits || 0), 0)
    const totalReceivedUnits = received.reduce((sum, r) => sum + (r.totalUnits || 0), 0)
    const totalInventoryItems = inventory.reduce((sum, i) => sum + i.quantity, 0)

    const stats = [
        {
            title: "Total Shipments",
            value: shipments.length,
            icon: Truck,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
        },
        {
            title: "Active Clients",
            value: clients.length,
            icon: Users,
            color: "from-emerald-500 to-green-500",
            bgColor: "bg-emerald-500/10",
        },
        {
            title: "Units Shipped",
            value: totalUnits,
            icon: Package,
            color: "from-violet-500 to-purple-500",
            bgColor: "bg-violet-500/10",
        },
        {
            title: "Inventory Items",
            value: totalInventoryItems,
            icon: AlertCircle,
            color: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-500/10",
        },
    ]

    const getActivityIcon = (action: string) => {
        switch (action) {
            case 'create':
                return Plus
            case 'update':
                return Activity
            case 'delete':
                return AlertCircle
            default:
                return Activity
        }
    }

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'create':
                return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', hover: 'group-hover:bg-emerald-500/20' }
            case 'update':
                return { bg: 'bg-blue-500/10', text: 'text-blue-500', hover: 'group-hover:bg-blue-500/20' }
            case 'delete':
                return { bg: 'bg-rose-500/10', text: 'text-rose-500', hover: 'group-hover:bg-rose-500/20' }
            default:
                return { bg: 'bg-gray-500/10', text: 'text-gray-500', hover: 'group-hover:bg-gray-500/20' }
        }
    }

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'Unknown'
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            const now = new Date()
            const diff = now.getTime() - date.getTime()
            const hours = Math.floor(diff / (1000 * 60 * 60))
            const days = Math.floor(hours / 24)

            if (hours < 1) return 'Just now'
            if (hours < 24) return `${hours}h ago`
            if (days < 7) return `${days}d ago`
            return format(date, 'MMM d')
        } catch {
            return 'Unknown'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground mt-1">
                        Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}! Here's what's happening today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(), 'MMM yyyy')}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        custom={i}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                    >
                        <Card className="card-hover relative overflow-hidden group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`h-4 w-4 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} style={{ color: stat.color.includes('rose') ? '#f43f5e' : stat.color.includes('emerald') ? '#10b981' : stat.color.includes('blue') ? '#3b82f6' : stat.color.includes('amber') ? '#f59e0b' : '#8b5cf6' }} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    <AnimatedCounter value={stat.value} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-4"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Overview</CardTitle>
                                    <CardDescription>Shipments vs Received goods</CardDescription>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-600" />
                                        <span className="text-muted-foreground">Shipments</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500" />
                                        <span className="text-muted-foreground">Received</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Area type="monotone" dataKey="shipments" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorShipments)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="received" stroke="hsl(var(--chart-2))" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Client Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-3"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Inventory by Client</CardTitle>
                            <CardDescription>Distribution of stock by client</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {clientDistribution.length === 0 ? (
                                <div className="h-[280px] flex items-center justify-center">
                                    <p className="text-muted-foreground">No inventory data available</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {clientDistribution.map((item, index) => (
                                            <div key={item.name} className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{item.name}</span>
                                                    <span className="font-medium">{item.value}%</span>
                                                </div>
                                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.value}%` }}
                                                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Activity & Revenue */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-3"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Activity</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {activities.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No recent activity</p>
                                ) : (
                                    activities.map((activity, i) => {
                                        const color = getActivityColor(activity.action)
                                        const Icon = getActivityIcon(activity.action)
                                        return (
                                            <motion.div
                                                key={activity.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + i * 0.1 }}
                                                className="flex items-start gap-4 group"
                                            >
                                                <div className={`p-2 rounded-lg transition-colors ${color.bg} ${color.hover}`}>
                                                    <Icon className={`h-4 w-4 ${color.text}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium capitalize">
                                                        {activity.action} {activity.collection}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {activity.documentName} by {activity.userName}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatTimestamp(activity.timestamp)}
                                                </span>
                                            </motion.div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Units Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="lg:col-span-4"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Units Trend</CardTitle>
                                    <CardDescription>Monthly units overview</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px]">
                                {monthlyData.every(m => m.shipments === 0 && m.received === 0) ? (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-muted-foreground">No data available for the last 6 months</p>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={monthlyData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                            <Bar dataKey="shipments" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="received" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
