"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, CheckCircle, Info, AlertTriangle, XCircle, Users, History, Search, Check, X, UserPlus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

interface SentNotification {
    id: string;
    recipientCount: number;
    title: string;
    type: string;
    createdAt: string;
}

export default function AdminNotificationsPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');

    // Modal State
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Map<string, User>>(new Map());
    const [isBroadcast, setIsBroadcast] = useState(false);

    // Compose State
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // History State
    const [history, setHistory] = useState<SentNotification[]>([]);

    // Fetch Users when modal opens
    const openPicker = async () => {
        setIsPickerOpen(true);
        if (users.length === 0) {
            setLoadingUsers(true);
            try {
                const res = await fetch('/api/admin/users?limit=50');
                const data = await res.json();
                if (data.users) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoadingUsers(false);
            }
        }
    };

    // Search users
    const searchUsers = async (query: string) => {
        setSearchQuery(query);
        if (query.length >= 2) {
            setLoadingUsers(true);
            try {
                const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=50`);
                const data = await res.json();
                if (data.users) {
                    setUsers(data.users);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoadingUsers(false);
            }
        }
    };

    const toggleUser = (user: User) => {
        const newSelected = new Map(selectedUsers);
        if (newSelected.has(user.id)) {
            newSelected.delete(user.id);
        } else {
            newSelected.set(user.id, user);
        }
        setSelectedUsers(newSelected);
    };

    const removeUser = (userId: string) => {
        const newSelected = new Map(selectedUsers);
        newSelected.delete(userId);
        setSelectedUsers(newSelected);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isBroadcast && selectedUsers.size === 0) {
            setStatus({ type: 'error', message: 'Please select at least one recipient' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            if (isBroadcast) {
                // TODO: Implement broadcast endpoint
                setStatus({ type: 'error', message: 'Broadcast not yet implemented' });
                setLoading(false);
                return;
            }

            // Send to each selected user
            const userIds = Array.from(selectedUsers.keys());
            const results = await Promise.all(
                userIds.map(userId =>
                    fetch('/api/admin/notifications/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, title, message, type }),
                    })
                )
            );

            const failed = results.filter(r => !r.ok).length;

            if (failed > 0) {
                setStatus({ type: 'error', message: `Sent to ${results.length - failed}/${results.length} users` });
            } else {
                setStatus({ type: 'success', message: `Sent to ${results.length} user${results.length > 1 ? 's' : ''}!` });
            }

            // Add to history
            setHistory(prev => [{
                id: Date.now().toString(),
                recipientCount: userIds.length,
                title,
                type,
                createdAt: new Date().toISOString()
            }, ...prev]);

            // Reset form
            setTitle("");
            setMessage("");
            setSelectedUsers(new Map());
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'compose', label: 'Compose', icon: Send },
        { id: 'history', label: 'History', icon: History },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Bell className="w-6 h-6 text-white" />
                        </div>
                        {t.settingsPage.notifications}
                    </h1>
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Send real-time notifications to users
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'compose' | 'history')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            )}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Compose Tab */}
            {activeTab === 'compose' && (
                <form onSubmit={handleSend} className="space-y-6">
                    {/* Status Message */}
                    <AnimatePresence mode="wait">
                        {status && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={cn(
                                    "p-4 rounded-xl flex items-center gap-3 text-sm font-medium",
                                    status.type === 'success'
                                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
                                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                                )}
                            >
                                {status.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                {status.message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Recipient Selection */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                        <Label className="text-base font-semibold mb-4 block">Recipients</Label>

                        {/* Mode Toggle */}
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => setIsBroadcast(false)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
                                    !isBroadcast
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600"
                                )}
                            >
                                <UserPlus size={18} />
                                Select Users
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsBroadcast(true)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
                                    isBroadcast
                                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                        : "border-neutral-200 dark:border-neutral-700 text-neutral-600"
                                )}
                            >
                                <Megaphone size={18} />
                                Broadcast All
                            </button>
                        </div>

                        {!isBroadcast && (
                            <>
                                {/* Selected Users Pills */}
                                {selectedUsers.size > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {Array.from(selectedUsers.values()).map(user => (
                                            <div
                                                key={user.id}
                                                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 pl-1 pr-2 py-1 rounded-full"
                                            >
                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-blue-200">
                                                    {user.avatar ? (
                                                        <Image src={user.avatar} alt={user.name} width={24} height={24} className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-blue-600 text-xs font-bold">
                                                            {user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium">{user.name?.split(' ')[0]}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeUser(user.id)}
                                                    className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center hover:bg-blue-300"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Open Picker Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={openPicker}
                                    className="w-full h-12 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <Users className="mr-2" size={18} />
                                    {selectedUsers.size > 0 ? `Add More Recipients (${selectedUsers.size} selected)` : 'Click to Select Recipients'}
                                </Button>
                            </>
                        )}

                        {isBroadcast && (
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    <strong>Broadcast Mode:</strong> This notification will be sent to all registered users.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Message Composition */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    placeholder="e.g. New Course Available!"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Message</Label>
                                <Textarea
                                    placeholder="Write your message here..."
                                    className="min-h-[120px] resize-none"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                                disabled={loading || (!isBroadcast && selectedUsers.size === 0)}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send size={18} />
                                        {isBroadcast ? 'Broadcast to All' : `Send to ${selectedUsers.size} User${selectedUsers.size !== 1 ? 's' : ''}`}
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Type Selector */}
                        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                            <Label className="mb-4 block">Type</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'info', icon: Info, label: 'Info', bg: 'bg-blue-500' },
                                    { id: 'success', icon: CheckCircle, label: 'Success', bg: 'bg-green-500' },
                                    { id: 'warning', icon: AlertTriangle, label: 'Warning', bg: 'bg-amber-500' },
                                    { id: 'error', icon: XCircle, label: 'Error', bg: 'bg-red-500' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setType(item.id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                                            type === item.id
                                                ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800"
                                                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300"
                                        )}
                                    >
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-2", item.bg)}>
                                            <item.icon className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-12 text-center">
                            <History className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                            <p className="text-neutral-500">No notifications sent yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {history.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            item.type === 'info' && "bg-blue-100 dark:bg-blue-900/30",
                                            item.type === 'success' && "bg-green-100 dark:bg-green-900/30",
                                            item.type === 'warning' && "bg-amber-100 dark:bg-amber-900/30",
                                            item.type === 'error' && "bg-red-100 dark:bg-red-900/30",
                                        )}>
                                            <Bell className={cn(
                                                "w-5 h-5",
                                                item.type === 'info' && "text-blue-600",
                                                item.type === 'success' && "text-green-600",
                                                item.type === 'warning' && "text-amber-600",
                                                item.type === 'error' && "text-red-600",
                                            )} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{item.title}</p>
                                            <p className="text-xs text-neutral-500">
                                                Sent to {item.recipientCount} user{item.recipientCount > 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-neutral-400">
                                        {new Date(item.createdAt).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* User Picker Modal */}
            <AnimatePresence>
                {isPickerOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setIsPickerOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-semibold">Select Recipients</h2>
                                    <button
                                        onClick={() => setIsPickerOpen(false)}
                                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-neutral-400" size={18} />
                                    <Input
                                        placeholder="Search by name or email..."
                                        className="pl-10"
                                        value={searchQuery}
                                        onChange={(e) => searchUsers(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Modal Body - User Grid */}
                            <div className="p-4 overflow-y-auto max-h-[50vh]">
                                {loadingUsers ? (
                                    <div className="grid grid-cols-4 gap-4">
                                        {[...Array(8)].map((_, i) => (
                                            <div key={i} className="flex flex-col items-center animate-pulse">
                                                <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                                                <div className="w-12 h-3 mt-2 rounded bg-neutral-200 dark:bg-neutral-800" />
                                            </div>
                                        ))}
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-500">
                                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No users found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-4">
                                        {users.map((user) => {
                                            const isSelected = selectedUsers.has(user.id);
                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => toggleUser(user)}
                                                    className="flex flex-col items-center group"
                                                >
                                                    <div className={cn(
                                                        "relative w-16 h-16 rounded-full overflow-hidden border-3 transition-all",
                                                        isSelected
                                                            ? "border-blue-500 ring-4 ring-blue-500/30 scale-105"
                                                            : "border-transparent group-hover:border-neutral-300 dark:group-hover:border-neutral-600"
                                                    )}>
                                                        {user.avatar ? (
                                                            <Image
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                                                                {user.name?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-blue-500/50 flex items-center justify-center">
                                                                <Check className="w-8 h-8 text-white" strokeWidth={3} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        "text-xs mt-2 text-center truncate w-full",
                                                        isSelected ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-neutral-600 dark:text-neutral-400"
                                                    )}>
                                                        {user.name?.split(' ')[0] || 'User'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                                <p className="text-sm text-neutral-500">
                                    {selectedUsers.size} selected
                                </p>
                                <Button
                                    onClick={() => setIsPickerOpen(false)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Done
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
