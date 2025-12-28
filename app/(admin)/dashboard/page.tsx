"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { Course } from "@/lib/constants/demo-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, TrendingUp, DollarSign, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/courses', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
                setCourses(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

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

    // Analytics data using actual courses
    const stats = {
        totalUsers: 1247,
        activeCourses: courses.length,
        totalRevenue: 45678,
        avgCompletion: 68,
    };

    const recentUsers = [
        { id: 1, name: "Alex Johnson", email: "alex@example.com", enrolled: 3, joined: "2 days ago" },
        { id: 2, name: "Sarah Chen", email: "sarah@example.com", enrolled: 5, joined: "3 days ago" },
        { id: 3, name: "Mike Williams", email: "mike@example.com", enrolled: 2, joined: "5 days ago" },
        { id: 4, name: "Emily Davis", email: "emily@example.com", enrolled: 4, joined: "1 week ago" },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-neutral-400 mt-1">Platform overview and management</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-green-400">+12%</span>
                    </div>
                    <p className="text-sm text-neutral-400">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalUsers.toLocaleString()}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-green-400">+3</span>
                    </div>
                    <p className="text-sm text-neutral-400">Active Courses</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.activeCourses}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-xs text-green-400">+8%</span>
                    </div>
                    <p className="text-sm text-neutral-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">${stats.totalRevenue.toLocaleString()}</p>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400 hover:bg-white/10 transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-yellow-400" />
                        </div>
                        <span className="text-xs text-green-400">+5%</span>
                    </div>
                    <p className="text-sm text-neutral-400">Avg Completion</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.avgCompletion}%</p>
                </Card>
            </div>

            {/* Recent Users */}
            <div className="space-y-4 animate-in fade-in duration-500 delay-500">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Recent Users</h2>
                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
                        View All →
                    </Button>
                </div>

                <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
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
                            <tbody className="divide-y divide-white/5">
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-sm font-medium text-white">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <span className="ml-3 text-sm font-medium text-white">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                            {user.enrolled} courses
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                                            {user.joined}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Course Management */}
            <div className="space-y-4 animate-in fade-in duration-500 delay-600">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">Course Management</h2>
                    <Link href="/courses">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Manage Courses →
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {courses.map((course) => (
                        <Card key={course.id} className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex gap-4">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-white line-clamp-1">{course.title}</h3>
                                            <p className="text-xs text-neutral-400">{course.category} • {course.instructor}</p>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <Link href={`/courses/${course.id}/edit`}>
                                                <button className="p-1.5 rounded hover:bg-white/10 text-neutral-400 hover:text-white">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button className="p-1.5 rounded hover:bg-white/10 text-red-400 hover:text-red-300">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-neutral-400">
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
