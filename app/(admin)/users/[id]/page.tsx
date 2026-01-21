"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    BookOpen,
    Shield,
    ShieldAlert,
    Ban,
    CheckCircle,
    Trash2,
    Loader2,
    Key,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    avatar?: string;
    phoneNumber?: string;
    bio?: string;
    enrolledCourses?: string[];
    completedCourses?: string[];
    createdAt?: string;
    isDisabled?: boolean;
}

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const userId = params.id as string;

    useEffect(() => {
        if (!isAdmin || !userId) return;

        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${userId}`);
                if (!res.ok) throw new Error('User not found');
                const data = await res.json();
                setUser(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load user');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [isAdmin, userId]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleAction = async (action: string) => {
        if (!user) return;
        setActionLoading(action);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    updates: action === 'makeAdmin' ? { role: 'admin' } :
                        action === 'makeStudent' ? { role: 'student' } :
                            action === 'disable' ? { isDisabled: true } :
                                action === 'enable' ? { isDisabled: false } : {},
                }),
            });

            if (!res.ok) throw new Error('Action failed');

            // Refresh user data
            const updated = await res.json();
            setUser(prev => prev ? { ...prev, ...updated.user } : null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        if (!confirm(`Are you sure you want to DELETE user "${user.name || user.email}"? This cannot be undone.`)) return;

        setActionLoading('delete');
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            router.push('/users');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Delete failed');
            setActionLoading(null);
        }
    };

    const handleResetPassword = async () => {
        if (!user) return;
        if (!confirm(`Send password reset email to ${user.email}?`)) return;

        setActionLoading('reset');
        try {
            // This would trigger a password reset email
            alert(`Password reset email would be sent to ${user.email}`);
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-6">
                <Link href="/users" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6">
                    <ArrowLeft size={16} /> Back to Users
                </Link>
                <div className="p-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
                    <p className="text-red-600 dark:text-red-400">{error || 'User not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link href="/users" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                    <ArrowLeft size={16} /> Back to Users
                </Link>
            </div>

            {/* User Profile Card */}
            <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                {/* Header Banner */}
                <div className="h-20 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

                {/* Profile Info */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {user.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-20 h-20 rounded-xl object-cover border-4 border-white dark:border-neutral-900 shadow-lg bg-white"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-neutral-100 dark:bg-neutral-700 border-4 border-white dark:border-neutral-900 shadow-lg flex items-center justify-center">
                                    <User size={28} className="text-neutral-400" />
                                </div>
                            )}
                            {user.isDisabled && (
                                <div className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full">
                                    <Ban size={12} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name & Badge */}
                        <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {user.name || 'Unknown User'}
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${user.role === 'admin'
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                                    }`}>
                                    {user.role === 'admin' ? 'Admin' : 'Student'}
                                </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="flex items-center gap-1.5">
                                    <Mail size={14} className="text-neutral-400" />
                                    {user.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-neutral-400" />
                                    Joined {formatDate(user.createdAt)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <BookOpen size={14} className="text-neutral-400" />
                                    {user.enrolledCourses?.length || 0} courses
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Admin Actions</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* Role Toggle */}
                    {user.role === 'student' ? (
                        <button
                            onClick={() => handleAction('makeAdmin')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'makeAdmin' ? (
                                <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                            ) : (
                                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            )}
                            <div className="text-left">
                                <p className="font-medium text-amber-900 dark:text-amber-200">Make Admin</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400">Grant admin privileges</p>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('makeStudent')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'makeStudent' ? (
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                            ) : (
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            )}
                            <div className="text-left">
                                <p className="font-medium text-blue-900 dark:text-blue-200">Make Student</p>
                                <p className="text-xs text-blue-700 dark:text-blue-400">Remove admin privileges</p>
                            </div>
                        </button>
                    )}

                    {/* Disable/Enable */}
                    {user.isDisabled ? (
                        <button
                            onClick={() => handleAction('enable')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'enable' ? (
                                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                            ) : (
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            )}
                            <div className="text-left">
                                <p className="font-medium text-green-900 dark:text-green-200">Enable Account</p>
                                <p className="text-xs text-green-700 dark:text-green-400">Restore user access</p>
                            </div>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleAction('disable')}
                            disabled={!!actionLoading}
                            className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50"
                        >
                            {actionLoading === 'disable' ? (
                                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                            ) : (
                                <Ban className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            )}
                            <div className="text-left">
                                <p className="font-medium text-orange-900 dark:text-orange-200">Disable Account</p>
                                <p className="text-xs text-orange-700 dark:text-orange-400">Suspend user access</p>
                            </div>
                        </button>
                    )}

                    {/* Reset Password */}
                    <button
                        onClick={handleResetPassword}
                        disabled={!!actionLoading}
                        className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === 'reset' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                        ) : (
                            <Key className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        )}
                        <div className="text-left">
                            <p className="font-medium text-neutral-900 dark:text-neutral-200">Reset Password</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">Send reset email</p>
                        </div>
                    </button>

                    {/* Delete User */}
                    <button
                        onClick={handleDelete}
                        disabled={!!actionLoading}
                        className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === 'delete' ? (
                            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                        ) : (
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                        <div className="text-left">
                            <p className="font-medium text-red-900 dark:text-red-200">Delete User</p>
                            <p className="text-xs text-red-700 dark:text-red-400">Permanently remove</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* User Activity (placeholder) */}
            <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Enrolled Courses</h2>
                {user.enrolledCourses && user.enrolledCourses.length > 0 ? (
                    <ul className="space-y-2">
                        {user.enrolledCourses.map((courseId, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                                <BookOpen size={14} className="text-blue-500" />
                                <span>Course ID: {courseId}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-neutral-500 text-sm">No courses enrolled</p>
                )}
            </div>
        </div>
    );
}
