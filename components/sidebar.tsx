"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { LOGO } from "@/lib/logo"
import {
    LayoutDashboard,
    Package,
    Truck,
    Users,
    FileText,
    Boxes,
    Settings,
    ChevronRight,
    Activity,
    UserCog,
    LogOut,
    Shield,
} from "lucide-react"

const baseRoutes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "from-sky-400 to-blue-500",
    },
    {
        label: "Inventory",
        icon: Boxes,
        href: "/inventory",
        color: "from-violet-400 to-purple-500",
    },
    {
        label: "Shipments",
        icon: Truck,
        href: "/shipments",
        color: "from-pink-400 to-rose-500",
    },
    {
        label: "Goods Received",
        icon: Package,
        href: "/received",
        color: "from-orange-400 to-amber-500",
    },
    {
        label: "Clients",
        icon: Users,
        href: "/clients",
        color: "from-emerald-400 to-green-500",
    },
    {
        label: "Reports",
        icon: FileText,
        href: "/reports",
        color: "from-teal-400 to-cyan-500",
    },
]

const adminRoutes = [
    {
        label: "Activity Log",
        icon: Activity,
        href: "/activity-log",
        color: "from-yellow-400 to-orange-500",
    },
    {
        label: "User Management",
        icon: UserCog,
        href: "/users",
        color: "from-indigo-400 to-purple-500",
    },
]

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: {
            delay: i * 0.1,
            duration: 0.3,
            ease: [0.4, 0, 0.2, 1] as const
        }
    })
}

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, isSuperAdmin, isAdmin, logout } = useAuth()

    // Super Admin and Admin users can see admin routes (Activity Log, User Management)
    const canAccessAdmin = isSuperAdmin || isAdmin
    const routes = canAccessAdmin ? [...baseRoutes, ...adminRoutes] : baseRoutes

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 text-foreground border-r border-border overflow-hidden">
            {/* Logo Section */}
            <div className="px-6 py-5 flex-shrink-0">
                <Link href="/dashboard" className="flex items-center group">
                    <motion.div
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {/* Panda Logo from old project */}
                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-full">
                            <img
                                src={LOGO}
                                alt="PandaLogix logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </motion.div>
                    <div className="ml-4">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            PandaLogix
                        </h1>
                        <p className="text-xs text-muted-foreground">Warehouse Management</p>
                    </div>
                </Link>
            </div>

            {/* Divider */}
            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent flex-shrink-0" />

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600">
                {routes.map((route, i) => {
                    const isActive = pathname === route.href
                    return (
                        <motion.div
                            key={route.href}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                        >
                            <Link
                                href={route.href}
                                className={cn(
                                    "group flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative",
                                    isActive
                                        ? "bg-primary/10 text-foreground shadow-lg dark:bg-white/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className={cn("absolute -left-4 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b z-10", route.color)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                )}

                                {/* Icon with gradient background on active */}
                                <div className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300 relative z-20",
                                    isActive
                                        ? `bg-gradient-to-br ${route.color} shadow-lg`
                                        : "bg-muted group-hover:bg-muted/80"
                                )}>
                                    <route.icon className={cn(
                                        "h-5 w-5 transition-colors",
                                        isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"
                                    )} />
                                </div>

                                <span className="ml-3 flex-1">{route.label}</span>

                                {/* Arrow indicator on hover */}
                                <ChevronRight className={cn(
                                    "h-4 w-4 transition-all duration-300 text-muted-foreground",
                                    isActive ? "opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                )} />
                            </Link>
                        </motion.div>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 space-y-1.5 flex-shrink-0 border-t border-border">
                <Link
                    href="/settings"
                    className="group flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300"
                >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted group-hover:bg-muted/80 transition-all">
                        <Settings className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors group-hover:rotate-90 duration-300" />
                    </div>
                    <span className="ml-3">Settings</span>
                </Link>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full group flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-red-500/10 transition-all duration-300"
                >
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted group-hover:bg-red-500/20 transition-all">
                        <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="ml-3 group-hover:text-red-400">Logout</span>
                </button>

                {/* User info */}
                {user && (
                    <div className="flex items-center px-4 py-2.5 rounded-xl bg-muted/50 mt-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-sm font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                            <div className="flex items-center gap-1">
                                {(isSuperAdmin || isAdmin) && (
                                    <Shield className="h-3 w-3 text-amber-400" />
                                )}
                                <p className="text-xs text-muted-foreground truncate">
                                    {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Staff'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
