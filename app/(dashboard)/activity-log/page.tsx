"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getActivityLogs } from "@/lib/firestore"
import { ActivityLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, Activity, RefreshCw, Plus, Pencil, Trash2, Filter } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"

export default function ActivityLogPage() {
    const { isSuperAdmin, isAdmin, loading: authLoading } = useAuth()
    const router = useRouter()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [actionFilter, setActionFilter] = useState<string>("all")
    const [collectionFilter, setCollectionFilter] = useState<string>("all")

    // Super Admin and Admin can access the activity log
    const canAccessPage = isSuperAdmin || isAdmin

    useEffect(() => {
        if (!authLoading && !canAccessPage) {
            router.push('/dashboard')
            return
        }

        if (!authLoading && canAccessPage) {
            loadLogs()
        }
    }, [canAccessPage, authLoading, router])

    const loadLogs = async () => {
        setLoading(true)
        try {
            const data = await getActivityLogs(200)
            setLogs(data)
        } catch (error) {
            console.error('Error loading activity logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesAction = actionFilter === "all" || log.action === actionFilter
        const matchesCollection = collectionFilter === "all" || log.collection === collectionFilter

        return matchesSearch && matchesAction && matchesCollection
    })

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create':
                return <Plus className="h-4 w-4 text-emerald-500" />
            case 'update':
                return <Pencil className="h-4 w-4 text-blue-500" />
            case 'delete':
                return <Trash2 className="h-4 w-4 text-red-500" />
            default:
                return <Activity className="h-4 w-4" />
        }
    }

    const getActionBadge = (action: string) => {
        const styles = {
            create: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            update: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            delete: 'bg-red-500/10 text-red-500 border-red-500/20',
        }
        return styles[action as keyof typeof styles] || 'bg-gray-500/10 text-gray-500'
    }

    const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return 'Unknown'
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
            return format(date, 'MMM d, yyyy h:mm a')
        } catch {
            return 'Invalid date'
        }
    }

    // Get unique collections from logs
    const collections = [...new Set(logs.map(log => log.collection))]

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading activity logs...</p>
                </div>
            </div>
        )
    }

    if (!canAccessPage) {
        return null
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
                    <p className="text-muted-foreground">Track all system activities and changes</p>
                </div>
                <Button onClick={loadLogs} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user, document, or details..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="w-full sm:w-[150px]">
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="create">Create</SelectItem>
                                    <SelectItem value="update">Update</SelectItem>
                                    <SelectItem value="delete">Delete</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full sm:w-[180px]">
                            <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Collections</SelectItem>
                                    {collections.map(col => (
                                        <SelectItem key={col} value={col}>
                                            {col.charAt(0).toUpperCase() + col.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Collection</TableHead>
                            <TableHead>Document</TableHead>
                            <TableHead className="hidden md:table-cell">Details</TableHead>
                            <TableHead className="text-right">When</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    {logs.length === 0 ? 'No activity logs yet.' : 'No matching logs found.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <motion.tr
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionBadge(log.action)}`}>
                                            {getActionIcon(log.action)}
                                            <span className="capitalize">{log.action}</span>
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xs font-bold text-white">
                                                {log.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{log.userName}</p>
                                                <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm capitalize">{log.collection}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{log.documentName}</span>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className="text-sm text-muted-foreground">{log.details}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm text-muted-foreground">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </TableCell>
                                </motion.tr>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {filteredLogs.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                    Showing {filteredLogs.length} of {logs.length} activities
                </p>
            )}
        </div>
    )
}
