"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <div className="h-5 w-5" />
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative overflow-hidden group"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {theme === "dark" ? (
                            <motion.div
                                key="moon"
                                initial={{ rotate: -90, scale: 0, opacity: 0 }}
                                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                exit={{ rotate: 90, scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Moon className="h-5 w-5 text-slate-400 group-hover:text-yellow-400 transition-colors" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="sun"
                                initial={{ rotate: 90, scale: 0, opacity: 0 }}
                                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                exit={{ rotate: -90, scale: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Sun className="h-5 w-5 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === "light" && (
                        <motion.div
                            layoutId="themeCheck"
                            className="ml-auto h-2 w-2 rounded-full bg-emerald-500"
                        />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === "dark" && (
                        <motion.div
                            layoutId="themeCheck"
                            className="ml-auto h-2 w-2 rounded-full bg-emerald-500"
                        />
                    )}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {theme === "system" && (
                        <motion.div
                            layoutId="themeCheck"
                            className="ml-auto h-2 w-2 rounded-full bg-emerald-500"
                        />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
