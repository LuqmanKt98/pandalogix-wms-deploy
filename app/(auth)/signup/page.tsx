"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to login page immediately
        router.push("/login");
    }, [router]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-full bg-slate-900/50 border-slate-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
                        <AlertCircle className="w-9 h-9 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Access Restricted</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Public sign-up is disabled. Please contact your administrator to create an account.</span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
