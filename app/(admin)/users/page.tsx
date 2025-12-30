"use client";

import { useState, useEffect, useCallback } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    Search,
    Users,
    Shield,
    ShieldAlert,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    User as UserIcon
} from "lucide-react";

interface User {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'admin';
    avatar?: string;
    enrolledCourses?: string[];
    createdAt?: string;
    isDisabled?: boolean;
}

interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export default function UsersPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [data, setData] = useState<UsersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin'>('all');
    const [page, setPage] = useState(1);
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '20',
            });
            if (search) params.set('search', search);
            if (roleFilter !== 'all') params.set('role', roleFilter);

            const res = await fetch(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    }, [page, search, roleFilter]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleRoleChange = async (userId: string, newRole: 'student' | 'admin') => {
        setUpdating(userId);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    updates: { role: newRole },
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update');
            }

            // Refresh list
            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setUpdating(null);
        }
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-neutral-400 text-sm">
                        {data ? `${data.total} users total` : 'Loading...'}
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </form>
                <div className="flex gap-2">
                    {(['all', 'student', 'admin'] as const).map((role) => (
                        <button
                            key={role}
                            onClick={() => { setRoleFilter(role); setPage(1); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === role
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-zinc-800 text-neutral-400 hover:text-white'
                                }`}
                        >
                            {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-neutral-500 border-b border-zinc-800 bg-zinc-900/50">
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Courses</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-neutral-300">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : data?.users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                data?.users.map((user) => (
                                    <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                                                        <UserIcon size={16} className="text-neutral-400" />
                                                    </div>
                                                )}
                                                <span className="font-medium text-white">{user.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-400">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role === 'admin' ? (
                                                    <ShieldAlert size={12} />
                                                ) : (
                                                    <Shield size={12} />
                                                )}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-400">
                                            {user.enrolledCourses?.length || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as 'student' | 'admin')}
                                                disabled={updating === user.id}
                                                className="bg-zinc-800 border border-zinc-700 text-neutral-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                <option value="student">Student</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900/30">
                        <span className="text-neutral-500 text-sm">
                            Page {data.page} of {data.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                                disabled={page >= data.pages}
                                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
