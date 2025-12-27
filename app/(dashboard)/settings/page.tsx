"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { ChevronRight, Trash2, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
        }
    }, [user]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;

                // Upload
                const res = await fetch('/api/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: base64String,
                        filename: `avatar-${user.id}-${Date.now()}.jpg`
                    }),
                });

                if (!res.ok) throw new Error('Upload failed');
                const { url } = await res.json();

                // Update Profile
                await hybridStorage.profile.update(user.id, { avatar: url });

                // Refresh Context to show new avatar instantly
                refreshUser();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Failed to upload avatar", error);
            alert("Failed to upload avatar");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (!user || !tempName.trim()) return;

        try {
            await hybridStorage.profile.update(user.id, { name: tempName });
            setName(tempName);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update name");
        }
    };

    const handleDeleteAccount = () => {
        if (confirm("Delete your account? This cannot be undone.")) {
            alert("Account deletion would be processed here.");
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center h-[50vh] text-neutral-400">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-neutral-400 mt-1">Manage your account and preferences</p>
                </div>

                {/* Profile Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-4">
                        Profile
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        {/* Avatar */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="h-16 w-16 rounded-full object-cover border-2 border-white/10 group-hover:border-blue-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-white border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                                            {user.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                        <Camera className="w-5 h-5 text-white" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                    {isUploading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Profile Picture</div>
                                    <div className="text-xs text-neutral-400 mt-1">Click to upload a new avatar</div>
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        {isEditing ? (
                            <div className="p-4 border-b border-white/5">
                                <label className="text-sm text-neutral-400">Name</label>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        autoFocus
                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm text-neutral-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveName}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setTempName(name);
                                    setIsEditing(true);
                                }}
                                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5"
                            >
                                <div className="text-left">
                                    <div className="text-sm text-neutral-400">Name</div>
                                    <div className="text-white mt-0.5">{name || "Not set"}</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500" />
                            </button>
                        )}

                        {/* Email */}
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-sm text-neutral-400">Email</div>
                                <div className="text-white mt-0.5">{user.email}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-4">
                        Security
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                        <Link href="/settings/security">
                            <button className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="text-left">
                                    <div className="text-white">Password & Email</div>
                                    <div className="text-sm text-neutral-400 mt-0.5">
                                        Change your password or email address
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-4">
                        Notifications
                    </h2>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-white">Email Notifications</div>
                                <div className="text-sm text-neutral-400 mt-0.5">
                                    Course updates and announcements
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-white">Course Reminders</div>
                                <div className="text-sm text-neutral-400 mt-0.5">Daily learning reminders</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-white">Achievements</div>
                                <div className="text-sm text-neutral-400 mt-0.5">Badges and milestones</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 px-4">
                        Danger Zone
                    </h2>
                    <div className="bg-red-500/10 rounded-xl border border-red-500/20 overflow-hidden">
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full p-4 flex items-center justify-between hover:bg-red-500/20 transition-colors"
                        >
                            <div className="text-left">
                                <div className="text-red-400 font-medium flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Delete Account
                                </div>
                                <div className="text-sm text-red-300/70 mt-0.5">
                                    Permanently delete your account and all data
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
