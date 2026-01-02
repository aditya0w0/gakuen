"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Course } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TrendingUp, DollarSign, Eye, Edit, Trash2, Settings, Zap, CreditCard } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface FeatureFlags {
    subscriptionsEnabled: boolean;
    aiEnabled: boolean;
    updatedAt: string;
    updatedBy?: string;
}

interface DashboardStats {
    totalUsers: number;
    activeCourses: number;
    totalRevenue: number;
    avgCompletion: number;
}

interface RecentUser {
    id: string;
    name: string;
    email: string;
    enrolledCourses?: string[];
    createdAt?: string;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [features, setFeatures] = useState<FeatureFlags | null>(null);
    const [isTogglingFeature, setIsTogglingFeature] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch all data in parallel for faster loading
                const [coursesRes, statsRes, usersRes, featuresRes] = await Promise.all([
                    fetch('/api/courses', { cache: 'no-store' }),
                    fetch('/api/admin/dashboard'),
                    fetch('/api/admin/users?limit=5&page=1'),
                    fetch('/api/admin/features'),
                ]);

                // Process courses
                if (coursesRes.ok) {
                    const coursesData = await coursesRes.json();
                    setCourses(Array.isArray(coursesData) ? coursesData : []);
                }

                // Process stats
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Process users
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setRecentUsers(usersData.users || []);
                }

                // Process feature flags
                if (featuresRes.ok) {
                    const featuresData = await featuresRes.json();
                    setFeatures(featuresData);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Toggle feature handler
    const handleToggleFeature = async (feature: 'subscriptionsEnabled' | 'aiEnabled') => {
        if (!features || isTogglingFeature) return;

        setIsTogglingFeature(feature);
        try {
            const res = await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [feature]: !features[feature] }),
            });

            if (res.ok) {
                const data = await res.json();
                setFeatures(data.flags);
            }
        } catch (error) {
            console.error('Failed to toggle feature:', error);
        } finally {
            setIsTogglingFeature(null);
        }
    };

    if (!user || user.role !== "admin") {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="text-neutral-400">Access denied. Admin only.</div>
            </div>
        );
    }

    if (isLoading) {
        return <div className="text-neutral-400">Loading dashboard...</div>;
    }

    // Format date helper - with NaN protection
    const formatJoinedDate = (dateString?: string) => {
        if (!dateString) return 'Recently';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Recently';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
        const months = Math.floor(diffDays / 30);
        if (months === 0) return 'Recently';
        return `${months} month${months > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-neutral-600 dark:text-neutral-400 mt-1">Platform overview and management</p>
            </div>

            {/* Feature Toggles - Admin Controls */}
            {features && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Quick Controls</span>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        {/* Subscriptions Toggle */}
                        <button
                            onClick={() => handleToggleFeature('subscriptionsEnabled')}
                            disabled={isTogglingFeature === 'subscriptionsEnabled'}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${features.subscriptionsEnabled
                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                                } ${isTogglingFeature === 'subscriptionsEnabled' ? 'opacity-50' : 'hover:opacity-80'}`}
                        >
                            <CreditCard className="w-4 h-4" />
                            <span className="text-sm font-medium">Subscriptions</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${features.subscriptionsEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                {features.subscriptionsEnabled ? 'ON' : 'OFF'}
                            </span>
                        </button>

                        {/* AI Toggle */}
                        <button
                            onClick={() => handleToggleFeature('aiEnabled')}
                            disabled={isTogglingFeature === 'aiEnabled'}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${features.aiEnabled
                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                                } ${isTogglingFeature === 'aiEnabled' ? 'opacity-50' : 'hover:opacity-80'}`}
                        >
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-medium">AI Features</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${features.aiEnabled ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                {features.aiEnabled ? 'ON' : 'OFF'}
                            </span>
                        </button>
                    </div>
                    {features.updatedBy && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                            Last updated by {features.updatedBy}
                        </p>
                    )}
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-green-400">+12%</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Users</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats?.totalUsers.toLocaleString() || '0'}</p>
                </Card>

                <Card className="p-6 bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-green-400">+3</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Active Courses</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats?.activeCourses || courses.length}</p>
                </Card>

                <Card className="p-6 bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-xs text-green-400">+8%</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">${stats?.totalRevenue.toLocaleString() || '0'}</p>
                </Card>

                <Card className="p-6 bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 hover:bg-neutral-200 dark:hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-xs text-green-400">+5%</span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Avg Completion</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{stats?.avgCompletion || 0}%</p>
                </Card>
            </div>

            {/* Recent Users */}
            <div className="space-y-4 animate-in fade-in duration-500 delay-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent Users</h2>
                    <Link href="/users">
                        <Button variant="ghost" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                            View All →
                        </Button>
                    </Link>
                </div>

                <Card className="bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-100 dark:bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Courses
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                                {recentUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                                            No recent users
                                        </td>
                                    </tr>
                                ) : (
                                    recentUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-neutral-700 dark:text-white">
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="ml-3 text-sm font-medium text-neutral-900 dark:text-white">{user.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-white">
                                                {user.enrolledCourses?.length || 0} courses
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                                                {formatJoinedDate(user.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <Link href={`/users?search=${encodeURIComponent(user.email)}`}>
                                                    <Button variant="ghost" size="sm" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Course Management */}
            <div className="space-y-4 animate-in fade-in duration-500 delay-600">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Course Management</h2>
                    <Link href="/courses">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Manage Courses →
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <Card key={course.id} className="p-4 bg-white dark:bg-white/5 border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-white/10 transition-all group">
                            <div className="flex gap-4">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-neutral-900 dark:text-white line-clamp-1">{course.title}</h3>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{course.category} • {course.instructor}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <Link href={`/courses/${course.id}/edit`}>
                                                <button className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-neutral-600 dark:text-neutral-400">
                                        <span>{course.lessons.length} lessons</span>
                                        <span>{course.duration}</span>
                                        <span className="text-yellow-400">★ {course.rating}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${course.level === "beginner" ? "bg-green-500/20 text-green-400" :
                                            course.level === "intermediate" ? "bg-yellow-500/20 text-yellow-400" :
                                                "bg-red-500/20 text-red-400"
                                            }`}>
                                            {course.level}
                                        </span>
                                        <span className="text-xs text-neutral-400">247 enrolled</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
