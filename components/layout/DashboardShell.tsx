"use client";

import React from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BookOpen, Settings, Home, Users, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const navItems = user?.role === "admin"
        ? [
            { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
            { icon: Users, label: "Users", href: "/users" },
            { icon: Settings, label: "Settings", href: "/settings" },
        ]
        : [
            { icon: Home, label: "Dashboard", href: "/user" },
            { icon: Compass, label: "Browse", href: "/browse" },
            { icon: BookOpen, label: "My Classes", href: "/my-classes" },
            { icon: Settings, label: "Settings", href: "/settings" },
        ];

    return (
        <div className="flex h-screen">
            <aside
                className={cn(
                    "border-r border-white/10 bg-black/20 backdrop-blur-md hidden md:flex flex-col transition-all duration-300 relative",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 bg-zinc-800 border border-zinc-700 text-neutral-400 hover:text-white p-1 rounded-full shadow-lg z-50 transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={cn("p-6 flex items-center", isCollapsed ? "justify-center" : "")}>
                    {isCollapsed ? (
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white cursor-help" title="Gakuen">
                            G
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Gakuen</h1>
                            <p className="text-xs text-neutral-500 mt-1">
                                {user?.role === "admin" ? "Admin Portal" : "Student Portal"}
                            </p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 space-y-2">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full text-neutral-400 hover:text-white hover:bg-white/5 flex items-center transition-all duration-200",
                                    pathname === item.href && "bg-white/10 text-white",
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

                <div className={cn("p-4 border-t border-white/5", isCollapsed ? "flex flex-col items-center" : "")}>
                    <div className={cn("flex items-center mb-4 transition-all", isCollapsed ? "justify-center px-0" : "px-2")}>
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-9 w-9 rounded-full object-cover border border-white/10"
                            />
                        ) : (
                            <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-white border border-white/10">
                                {user?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                        )}

                        {!isCollapsed && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-medium text-white truncate max-w-[140px]">{user?.name || "User"}</p>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-all",
                            isCollapsed ? "justify-center px-0 h-10 w-10 min-w-0" : "justify-start"
                        )}
                        onClick={logout}
                        title={isCollapsed ? "Sign Out" : undefined}
                    >
                        <LogOut className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                        {!isCollapsed && "Sign Out"}
                    </Button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
