"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/lib/hooks/useNotifications";

export function NotificationCenter({ collapsed }: { collapsed?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, loading, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotifications();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors",
                    collapsed && "mx-auto block"
                )}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            "absolute bottom-full mb-2 left-0 w-80 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden z-[100]",
                            collapsed ? "left-10" : "left-[calc(100%-20rem)]" // Fix position for collapsed/expanded
                        )}
                        style={{ maxHeight: '80vh', right: collapsed ? 'auto' : 0 }}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="overflow-y-auto max-h-[400px]">
                            {loading ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neutral-500 mx-auto mb-2" />
                                    <p className="text-sm">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500">
                                    <Bell size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                "p-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors relative group",
                                                !notification.read && "bg-blue-50/50 dark:bg-blue-900/10"
                                            )}
                                        >
                                            <div className="flex gap-3">
                                                <div className={cn(
                                                    "w-2 h-2 mt-1.5 rounded-full shrink-0",
                                                    notification.type === 'success' ? "bg-green-500" :
                                                        notification.type === 'warning' ? "bg-amber-500" :
                                                            notification.type === 'error' ? "bg-red-500" : "bg-blue-500"
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm font-medium mb-0.5", !notification.read && "text-blue-700 dark:text-blue-300")}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-neutral-400 mt-2">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded text-neutral-500"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-neutral-500 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
