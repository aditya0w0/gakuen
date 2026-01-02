"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnime } from "@/components/animations/useAnime";
import { useState, FormEvent, useEffect, useRef } from "react";
import { Loader2, Mail, Lock, AlertCircle, User as UserIcon, Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/components/providers/SessionProvider";
import { firebaseAuth } from "@/lib/firebase/auth";
import { logger } from "@/lib/logger";

export default function LoginPage() {
    const { error: authError, login: authLogin, signup: authSignup } = useAuth();
    const { user: sessionUser, isLoading: sessionLoading } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isRecoveringSession, setIsRecoveringSession] = useState(false);
    const sessionRecoveryAttempted = useRef(false);

    // Session recovery: After hard refresh, Firebase Auth restores the user from IndexedDB
    // but the server-side cookie (firebase-token) may be missing/expired
    // This effect detects when SessionProvider has restored the user and redirects back
    useEffect(() => {
        // Only attempt recovery once per page load
        if (sessionRecoveryAttempted.current) return;

        // If session was restored (user exists), redirect to where they were going
        if (sessionUser) {
            sessionRecoveryAttempted.current = true;
            const redirect = searchParams.get('redirect') || '/user';
            logger.info('Session recovered on login page, redirecting back...', { redirect }, 'LoginPage');
            setIsRecoveringSession(true);

            // The SessionProvider already refreshed the cookie, just redirect
            router.replace(redirect);
        }
    }, [sessionUser, searchParams, router]);

    useAnime(".login-card", {
        translateY: [20, 0],
        opacity: [0, 1],
        ease: "out-expo",
        duration: 1000,
        delay: 200,
    });


    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
        if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
        return null;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mode === "signup") {
            // Validate password
            const passwordError = validatePassword(password);
            if (passwordError) {
                setError(passwordError);
                return;
            }

            // Check confirm password
            if (password !== confirmPassword) {
                setError("Passwords don't match");
                return;
            }
        }

        setIsLoading(true);

        try {
            if (mode === "signup") {
                await authSignup(email, password, name);
                // Don't set isLoading(false) here - AuthContext handles redirect
                // Setting it false might re-enable button before redirect completes
            } else {
                await authLogin(email, password);
                // Same for login - AuthContext handles redirect
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Authentication failed";
            setError(errorMessage);
            setIsLoading(false); // Only reset loading on error
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const user = await hybridStorage.auth.signInWithGoogle();
            router.push(user.role === "admin" ? "/dashboard" : "/user");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Google sign-in failed";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading state ONLY during active session recovery (user was already logged in)
    // Don't block on sessionLoading - users visiting login page should see the form immediately
    if (isRecoveringSession) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-white" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Restoring your session...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
            {/* Back to Home */}
            <Link
                href="/"
                className="fixed top-4 left-4 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
                ← Back to Home
            </Link>

            <Card className="login-card w-full max-w-md border-neutral-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-xl shadow-2xl opacity-0">
                <CardHeader className="text-center space-y-1">
                    <CardTitle className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mb-2">
                        {mode === "signup" ? "Create Account" : "Welcome Back"}
                    </CardTitle>
                    <CardDescription className="text-neutral-500 dark:text-neutral-400">
                        {mode === "signup" ? "Join Gakuen to start learning" : "Sign in to continue your journey"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === "signup" && (
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Yuki Tanaka"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="student@gakuen.edu"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={mode === "signup" ? 8 : 6}
                                    className="w-full pl-10 pr-11 py-2.5 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {mode === "signup" && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                        {password.length >= 8 ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-neutral-400" />
                                        )}
                                        <span className={password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>8+ characters</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {/[A-Z]/.test(password) ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-neutral-400" />
                                        )}
                                        <span className={/[A-Z]/.test(password) ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>1 uppercase letter</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {/[0-9]/.test(password) ? (
                                            <Check className="w-3.5 h-3.5 text-green-500" />
                                        ) : (
                                            <X className="w-3.5 h-3.5 text-neutral-400" />
                                        )}
                                        <span className={/[0-9]/.test(password) ? "text-green-600 dark:text-green-400" : "text-neutral-500"}>1 number</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {mode === "signup" && (
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="w-full pl-10 pr-11 py-2.5 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {(error || authError) && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error || authError}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-blue-600 text-white hover:bg-blue-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {mode === "signup" ? "Creating account..." : "Signing in..."}
                                </>
                            ) : (
                                mode === "signup" ? "Create Account" : "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-200 dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white dark:bg-black/40 px-2 text-neutral-500 dark:text-neutral-600">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full h-11 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    >
                        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </Button>

                    <div className="text-center text-sm">
                        <button
                            type="button"
                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                        >
                            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                            <span className="text-blue-600 dark:text-white font-medium">
                                {mode === "login" ? "Sign up" : "Sign in"}
                            </span>
                        </button>
                    </div>

                    <p className="text-xs text-center text-neutral-400 dark:text-neutral-600">
                        Demo: student@gakuen.edu / any password (6+ chars)
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
