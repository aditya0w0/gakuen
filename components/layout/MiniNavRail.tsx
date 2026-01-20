"use client";

import { Home, Compass, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface MiniNavRailProps {
    className?: string;
}

const navItems = [
    { icon: Home, label: "Home", href: "/user" },
    { icon: Compass, label: "Browse", href: "/browse" },
    { icon: BookOpen, label: "Classes", href: "/my-classes" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

/**
 * Minimal icon-only navigation rail for immersive pages
 * Designed to provide quick navigation without breaking fullscreen layouts
 */
export function MiniNavRail({ className }: MiniNavRailProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                "flex flex-col items-center py-4 px-2 bg-white dark:bg-zinc-900 border-r border-neutral-200 dark:border-zinc-800 w-14 flex-shrink-0",
                className
            )}
        >
            {/* Logo */}
            <Link href="/user" className="mb-6">
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
            </Link>

            {/* Navigation Icons */}
            <nav className="flex-1 flex flex-col items-center gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200",
                                isActive
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
