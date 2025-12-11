"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { LOGO } from "@/lib/logo";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const { login, resetPassword, error, clearError } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        clearError();

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            // Error is handled by context
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsLoading(true);
        clearError();

        try {
            await resetPassword(email);
            setResetSent(true);
        } catch (err) {
            // Error is handled by context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="w-full backdrop-blur-sm shadow-xl bg-card/50 border-border">
                <CardHeader className="space-y-1 text-center">
                    {/* Panda Logo */}
                    <div className="mx-auto w-24 h-24 flex items-center justify-center mb-4 overflow-hidden rounded-full">
                        <img
                            src={LOGO}
                            alt="PandaLogix logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {showResetPassword ? "Reset Password" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {showResetPassword
                            ? "Enter your email to receive a reset link"
                            : "Sign in to PandaLogix WMS"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                        >
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {resetSent && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm"
                        >
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            <span>Password reset email sent! Check your inbox.</span>
                        </motion.div>
                    )}

                    {showResetPassword ? (
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-foreground">Password</Label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetPassword(true);
                                            setResetSent(false);
                                            clearError();
                                        }}
                                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10 bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    {showResetPassword && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowResetPassword(false);
                                setResetSent(false);
                                clearError();
                            }}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            ← Back to sign in
                        </button>
                    )}
                </CardFooter>
            </Card>
        </motion.div>
    );
}
