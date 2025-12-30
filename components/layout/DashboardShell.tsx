"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Settings, Home, Users, ChevronLeft, ChevronRight, Compass, BarChart3, BookMarked } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { useTranslation } from "@/lib/i18n";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { t } = useTranslation();

    const navItems = user?.role === "admin"
        ? [
            { icon: LayoutDashboard, label: t.dashboard, href: "/dashboard" },
            { icon: BookMarked, label: "Courses", href: "/courses" },
            { icon: Users, label: "Users", href: "/users" },
            { icon: BarChart3, label: "Analytics", href: "/analytics" },
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
                    "border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 backdrop-blur-md hidden md:flex flex-col transition-all duration-300 relative",
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
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white cursor-help" title="Gakuen">
                            G
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Gakuen</h1>
                            <p className="text-xs text-neutral-500 mt-1">
                                {user?.role === "admin" ? t.dash.adminPortal : t.dash.studentPortal}
                            </p>
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
                    <UserMenu collapsed={isCollapsed} />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-neutral-50 dark:bg-neutral-950">
                <main className="flex-1 p-4 pb-20 md:pb-8 md:p-8 overflow-y-auto">
                    {children}
                </main>
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
