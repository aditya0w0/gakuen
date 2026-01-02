"use client";

import { useState, useEffect } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Users,
    Activity,
    RefreshCw,
    Download
} from "lucide-react";

interface AnalyticsSummary {
    today: { calls: number; cost: number };
    week: { calls: number; cost: number };
    month: { calls: number; cost: number };
    topEndpoints: { endpoint: string; count: number }[];
    topUsers: { email: string; count: number }[];
    recentCalls: {
        id: string;
        endpoint: string;
        method: string;
        userEmail: string;
        timestamp: number;
        duration: number;
        cost?: number;
        model?: string;
    }[];
}

export default function AnalyticsPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/analytics?type=summary');
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchAnalytics();
            // Auto-refresh every 30 seconds
            const interval = setInterval(fetchAnalytics, 30000);
            return () => clearInterval(interval);
        }
    }, [isAdmin]);

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
    const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">API Analytics</h1>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">Monitor API usage and costs</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAnalytics}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => window.open('/api/admin/analytics?type=export', '_blank')}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white rounded-lg text-sm transition-colors"
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {data && (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="Today"
                            calls={data.today.calls}
                            cost={data.today.cost}
                            icon={<Activity className="text-blue-400" />}
                            color="blue"
                        />
                        <StatCard
                            title="This Week"
                            calls={data.week.calls}
                            cost={data.week.cost}
                            icon={<TrendingUp className="text-green-400" />}
                            color="green"
                        />
                        <StatCard
                            title="This Month"
                            calls={data.month.calls}
                            cost={data.month.cost}
                            icon={<BarChart3 className="text-blue-400" />}
                            color="blue"
                        />
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Endpoints */}
                        <div className="bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl p-5">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                <BarChart3 size={18} className="text-blue-400" />
                                Top Endpoints
                            </h3>
                            {data.topEndpoints.length === 0 ? (
                                <p className="text-neutral-500 text-sm">No data yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.topEndpoints.slice(0, 5).map((ep, i) => (
                                        <div key={ep.endpoint} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-neutral-500 text-sm w-5">{i + 1}.</span>
                                                <code className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-200 dark:bg-zinc-800 px-2 py-1 rounded">
                                                    {ep.endpoint}
                                                </code>
                                            </div>
                                            <span className="text-neutral-400 text-sm">{ep.count} calls</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Users */}
                        <div className="bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl p-5">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users size={18} className="text-green-400" />
                                Top Users
                            </h3>
                            {data.topUsers.length === 0 ? (
                                <p className="text-neutral-500 text-sm">No data yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.topUsers.slice(0, 5).map((user, i) => (
                                        <div key={user.email} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-neutral-500 text-sm w-5">{i + 1}.</span>
                                                <span className="text-neutral-700 dark:text-neutral-300 text-sm">{user.email}</span>
                                            </div>
                                            <span className="text-neutral-400 text-sm">{user.count} calls</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Calls */}
                    <div className="bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Recent API Calls</h3>
                        {data.recentCalls.length === 0 ? (
                            <p className="text-neutral-500 text-sm">No recent calls</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-zinc-800">
                                            <th className="pb-2">Time</th>
                                            <th className="pb-2">Method</th>
                                            <th className="pb-2">Endpoint</th>
                                            <th className="pb-2">User</th>
                                            <th className="pb-2">Duration</th>
                                            <th className="pb-2">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-neutral-300">
                                        {data.recentCalls.map((call) => (
                                            <tr key={call.id} className="border-b border-zinc-800/50">
                                                <td className="py-2 text-neutral-500">{formatTime(call.timestamp)}</td>
                                                <td className="py-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${call.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                                                        call.method === 'POST' ? 'bg-blue-500/20 text-blue-400' :
                                                            call.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-yellow-500/20 text-yellow-400'
                                                        }`}>
                                                        {call.method}
                                                    </span>
                                                </td>
                                                <td className="py-2 font-mono text-xs">{call.endpoint}</td>
                                                <td className="py-2 text-neutral-400">{call.userEmail}</td>
                                                <td className="py-2 text-neutral-400">{call.duration}ms</td>
                                                <td className="py-2">
                                                    {call.cost ? (
                                                        <span className="text-green-400">{formatCost(call.cost)}</span>
                                                    ) : (
                                                        <span className="text-neutral-600">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({
    title,
    calls,
    cost,
    icon,
    color
}: {
    title: string;
    calls: number;
    cost: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'amber';
}) {
    const bgColors = {
        blue: 'bg-blue-500/10 border-blue-500/20',
        green: 'bg-green-500/10 border-green-500/20',
        amber: 'bg-amber-500/10 border-amber-500/20',
    };

    return (
        <div className={`${bgColors[color]} border rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-neutral-400 text-sm">{title}</span>
                {icon}
            </div>
            <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-neutral-900 dark:text-white">{calls.toLocaleString()}</span>
                    <span className="text-neutral-500 text-sm">calls</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                    <DollarSign size={14} className="text-green-400" />
                    <span className="text-green-400 font-medium">{cost.toFixed(4)}</span>
                    <span className="text-neutral-500">estimated</span>
                </div>
            </div>
        </div>
    );
}
