"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Menu, Search, Bell, Command, LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"

// Page titles mapping
const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/inventory': 'Inventory',
    '/shipments': 'Shipments',
    '/received': 'Goods Received',
    '/clients': 'Clients',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/activity-log': 'Activity Log',
    '/users': 'User Management',
}

export function Header() {
    const [searchOpen, setSearchOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()

    const pageTitle = pageTitles[pathname] || 'Dashboard'

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    const notifications = [
        { id: 1, title: "Low Stock Alert", desc: "Widget Pro below threshold", time: "2m ago", unread: true },
        { id: 2, title: "Shipment Delivered", desc: "Order #1234 completed", time: "1h ago", unread: true },
        { id: 3, title: "New Client", desc: "TechStart Inc. registered", time: "3h ago", unread: false },
    ]

    const unreadCount = notifications.filter(n => n.unread).length

    return (
        <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
            {/* Mobile Menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ModeToggle />

                {/* User Menu */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-sm font-bold text-white">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>

                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    )
}
