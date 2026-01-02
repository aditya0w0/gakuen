"use client";

import { useState, useEffect } from "react";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Check,
    X,
    Tag,
    Calendar,
    Users,
    Percent,
    Loader2,
    Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface Coupon {
    id: string;
    code: string;
    discountPercent: number;
    discountAmount?: number;
    validFrom: string;
    validUntil: string;
    maxUses: number;
    usedCount: number;
    applicableTo: string;
    applicableTiers?: string[];
    minPurchaseAmount?: number;
    isActive: boolean;
}

export default function CouponsPage() {
    const { isAdmin, isLoading: authLoading } = useRequireAdmin();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Confirmation modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

    // Form state
    const [formData, setFormData] = useState({
        code: "",
        discountPercent: 10,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        maxUses: 100,
        applicableTo: "all" as "all" | "subscription" | "course" | "bundle",
        isActive: true,
    });

    const fetchCoupons = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/coupons");
            if (!res.ok) throw new Error("Failed to fetch coupons");
            const data = await res.json();
            setCoupons(data.coupons || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchCoupons();
        }
    }, [isAdmin]);

    const handleOpenCreate = () => {
        setEditingCoupon(null);
        setFormData({
            code: "",
            discountPercent: 10,
            validFrom: new Date().toISOString().split("T")[0],
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            maxUses: 100,
            applicableTo: "all",
            isActive: true,
        });
        setShowModal(true);
    };

    const handleOpenEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            discountPercent: coupon.discountPercent,
            validFrom: coupon.validFrom.split("T")[0],
            validUntil: coupon.validUntil.split("T")[0],
            maxUses: coupon.maxUses,
            applicableTo: coupon.applicableTo as any,
            isActive: coupon.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : "/api/coupons";
            const method = editingCoupon ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save coupon");
            }

            setShowModal(false);
            fetchCoupons();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Coupon?",
            message: "This action cannot be undone. Are you sure you want to delete this coupon?",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
                    if (!res.ok) throw new Error("Failed to delete");
                    fetchCoupons();
                } catch (err) {
                    alert("Failed to delete coupon");
                }
            },
        });
    };

    const handleSeedDefaults = async () => {
        setConfirmModal({
            isOpen: true,
            title: "Seed Default Coupons?",
            message: "This will create default coupons if they don't exist. No duplicates will be created.",
            onConfirm: async () => {
                try {
                    const res = await fetch("/api/coupons?action=seed", { method: "PUT" });
                    if (!res.ok) throw new Error("Failed to seed");
                    fetchCoupons();
                } catch (err) {
                    alert("Failed to seed coupons");
                }
            },
        });
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Coupon Management</h1>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                        Create and manage discount coupons
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCoupons}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white rounded-lg text-sm transition-colors"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={handleSeedDefaults}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-200 dark:bg-zinc-800 hover:bg-neutral-300 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white rounded-lg text-sm transition-colors"
                    >
                        <Tag size={16} />
                        Seed Defaults
                    </button>
                    <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
                        <Plus size={16} className="mr-2" />
                        Create Coupon
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                    {error}
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    label="Total Coupons"
                    value={coupons.length}
                    icon={<Tag className="text-blue-400" />}
                />
                <StatCard
                    label="Active Coupons"
                    value={coupons.filter((c) => c.isActive).length}
                    icon={<Check className="text-green-400" />}
                />
                <StatCard
                    label="Total Redemptions"
                    value={coupons.reduce((sum, c) => sum + c.usedCount, 0)}
                    icon={<Users className="text-indigo-400" />}
                />
                <StatCard
                    label="Avg Discount"
                    value={`${Math.round(coupons.reduce((sum, c) => sum + c.discountPercent, 0) / (coupons.length || 1))}%`}
                    icon={<Percent className="text-amber-400" />}
                />
            </div>

            {/* Coupons Table */}
            <div className="bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-neutral-500 border-b border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900">
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Discount</th>
                                <th className="px-4 py-3 font-medium">Usage</th>
                                <th className="px-4 py-3 font-medium">Valid Until</th>
                                <th className="px-4 py-3 font-medium">Applies To</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-zinc-800">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                        No coupons yet. Create one or seed defaults.
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-neutral-50 dark:hover:bg-zinc-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <code className="px-2 py-1 bg-neutral-100 dark:bg-zinc-800 rounded font-mono text-sm">
                                                    {coupon.code}
                                                </code>
                                                <button
                                                    onClick={() => copyCode(coupon.code)}
                                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-green-500 font-medium">
                                            {coupon.discountPercent}% off
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                            {coupon.usedCount} / {coupon.maxUses}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                            {new Date(coupon.validUntil).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 capitalize">
                                                {coupon.applicableTo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {coupon.isActive ? (
                                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                                    <Check size={14} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 text-xs">
                                                    <X size={14} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(coupon)}
                                                    className="p-1.5 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="p-1.5 hover:bg-red-500/20 rounded text-neutral-500 hover:text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                            {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <Label>Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="WELCOME20"
                                    className="font-mono uppercase"
                                />
                            </div>

                            <div>
                                <Label>Discount Percent</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.discountPercent}
                                    onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Valid From</Label>
                                    <Input
                                        type="date"
                                        value={formData.validFrom}
                                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label>Valid Until</Label>
                                    <Input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Max Uses</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.maxUses}
                                    onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                                />
                            </div>

                            <div>
                                <Label>Applies To</Label>
                                <select
                                    value={formData.applicableTo}
                                    onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value as any })}
                                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-lg text-neutral-900 dark:text-white"
                                >
                                    <option value="all">All</option>
                                    <option value="subscription">Subscription Only</option>
                                    <option value="course">Course Only</option>
                                    <option value="bundle">Bundle Only</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                {editingCoupon ? "Save Changes" : "Create Coupon"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Confirm"
                variant="danger"
            />
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900/50 border border-neutral-200 dark:border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-neutral-400 text-sm">{label}</span>
                {icon}
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
        </div>
    );
}
