"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Settings, Home, Users, ChevronLeft, ChevronRight, Compass, BarChart3, BookMarked, Bell, Tag } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { UserMenu } from "./UserMenu";
import { NotificationCenter } from "./NotificationCenter";
import { useTranslation } from "@/lib/i18n";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    // Prevent hydration mismatch - render consistent state during SSR
    useEffect(() => {
        setMounted(true);
    }, []);

    // Use user nav during SSR to prevent hydration mismatch, then switch after mount
    const isAdmin = mounted && user?.role === "admin";

    const navItems = isAdmin
        ? [
            { icon: LayoutDashboard, label: t.dashboard, href: "/dashboard" },
            { icon: BookMarked, label: t.admin.courses, href: "/courses" },
            { icon: Users, label: t.admin.users, href: "/users" },
            { icon: Bell, label: t.settingsPage.notifications, href: "/notifications" },
            { icon: BarChart3, label: t.admin.analytics, href: "/analytics" },
            { icon: Tag, label: "Coupons", href: "/coupons" },
            { icon: Settings, label: t.settings, href: "/settings" },
        ]
        : [
            { icon: Home, label: t.home, href: "/user" },
            { icon: Compass, label: t.browse, href: "/browse" },
            { icon: BookOpen, label: t.classes, href: "/my-classes" },
            { icon: Settings, label: t.settings, href: "/settings" },
        ];

    return (
        <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-md hidden md:flex flex-col transition-all duration-300 relative z-30",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-full shadow-lg z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "")}>
                    {isCollapsed ? (
                        <>
                            <Image
                                src="/logo-light.png"
                                alt="Gakuen"
                                width={32}
                                height={32}
                                className="rounded-lg dark:hidden"
                            />
                            <Image
                                src="/logo-dark.png"
                                alt="Gakuen"
                                width={32}
                                height={32}
                                className="rounded-lg hidden dark:block"
                            />
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <>
                                <Image
                                    src="/logo-light.png"
                                    alt="Gakuen"
                                    width={36}
                                    height={36}
                                    className="rounded-lg dark:hidden"
                                />
                                <Image
                                    src="/logo-dark.png"
                                    alt="Gakuen"
                                    width={36}
                                    height={36}
                                    className="rounded-lg hidden dark:block"
                                />
                            </>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Gakuen</h1>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {user?.role === "admin" ? t.dash.adminPortal : t.dash.studentPortal}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center transition-all duration-200",
                                    pathname === item.href && "bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white",
                                    isCollapsed ? "justify-center px-0 py-3 h-12" : "justify-start px-4 py-2"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* User Menu at Bottom */}
                <div className={cn("p-3 border-t border-neutral-200 dark:border-neutral-800")}>
                    {isCollapsed ? (
                        <div className="flex flex-col gap-4 items-center">
                            <NotificationCenter collapsed />
                            <UserMenu collapsed />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <UserMenu />
                            </div>
                            <NotificationCenter />
                        </div>
                    )}
                </div>
            </aside>

            {/* Desktop Sidebar */}
            {/* ... aside code ... */}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950">
                {/* Mobile Top Bar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/logo-light.png"
                            alt="Gakuen"
                            width={32}
                            height={32}
                            className="rounded-lg dark:hidden"
                        />
                        <Image
                            src="/logo-dark.png"
                            alt="Gakuen"
                            width={32}
                            height={32}
                            className="rounded-lg hidden dark:block"
                        />
                        <span className="font-bold text-lg tracking-tight">Gakuen</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <NotificationCenter collapsed />
                        <UserMenu collapsed />
                    </div>
                </header>

                <main className="flex-1 p-4 pb-24 md:pb-12 md:p-8 overflow-y-auto">
                    {children}
                </main>

                {/* GPT-style Footer - User only, not admin */}
                {!isAdmin && (
                    <footer className="hidden md:flex items-center justify-center py-3 px-4 border-t border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Gakuen uses AI for translations and course generation. Content may vary.{" "}
                            <button
                                onClick={() => {
                                    // Trigger cookie consent modal
                                    const event = new CustomEvent('openCookiePreferences');
                                    window.dispatchEvent(event);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Cookie Preferences
                            </button>
                        </p>
                    </footer>
                )}
            </div>

            {/* Mobile Bottom Navigation - PWA Style */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-white/10 flex items-center justify-around md:hidden z-40 safe-area-pb">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full transition-colors py-2",
                            pathname === item.href ? "text-blue-600 dark:text-white" : "text-neutral-400 dark:text-neutral-500"
                        )}
                    >
                        <item.icon className={cn(
                            "w-5 h-5 transition-transform",
                            pathname === item.href && "scale-110"
                        )} />
                        <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                        {pathname === item.href && (
                            <div className="absolute bottom-1 w-1 h-1 bg-blue-600 dark:bg-white rounded-full" />
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
