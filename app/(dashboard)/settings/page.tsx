"use client";

import { authenticatedFetch } from "@/lib/api/authenticated-fetch";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { syncManager } from "@/lib/storage/sync-manager";
import { ChevronRight, Trash2, Camera, Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { SimpleModal } from "@/components/ui/SimpleModal";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [name, setName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const { t } = useTranslation();

    // Google Drive Token Handling
    const searchParams = useSearchParams();
    const router = useRouter();
    const [driveToken, setDriveToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = searchParams.get('token');
        const status = searchParams.get('google_drive');
        if (status === 'success' && token) {
            setDriveToken(token);
        }
    }, [searchParams]);

    const copyToClipboard = () => {
        if (driveToken) {
            navigator.clipboard.writeText(driveToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const closeDriveModal = () => {
        setDriveToken(null);
        router.replace('/settings');
    };

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
            // Upload using new API
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'avatar');
            formData.append('id', user.id);



            const res = await authenticatedFetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Upload failed');
            }
            const { url } = await res.json();

            // Update Profile in both local and Firebase
            await hybridStorage.profile.update(user.id, { avatar: url });

            // Force immediate sync to Firestore (don't wait for debounce)
            // This ensures avatar persists even if user hard refreshes immediately
            await syncManager.syncNow();

            // Refresh Context to show new avatar instantly
            await refreshUser();
        } catch (error: any) {
            console.error("Failed to upload avatar", error);
            // No rollback needed - avatar state wasn't updated until after success
            // The user's avatar remains unchanged as expected
            alert(error.message || "Failed to upload avatar");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveName = async () => {
        if (!user || !tempName.trim()) return;

        try {
            await hybridStorage.profile.update(user.id, { name: tempName });
            await syncManager.syncNow(); // Force immediate sync
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
                {t.loading}
            </div>
        );
    }

    return (
        <div className="flex justify-center">
            {/* Google Drive Token Modal */}
            <SimpleModal
                isOpen={!!driveToken}
                onClose={closeDriveModal}
                title="Google Drive Authorization Successful!"
                onConfirm={closeDriveModal}
                confirmText="Close"
                cancelText="Done"
                icon={<Check size={20} />}
                isDestructive={false}
            >
                <div className="space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Copy this <strong>Refresh Token</strong> and add it to your <code>.env</code> file (locally) and Vercel Environment Variables (production) as <code>GOOGLE_REFRESH_TOKEN</code>.
                    </p>
                    <div className="relative">
                        <pre className="bg-neutral-100 dark:bg-black/30 p-4 rounded-lg text-xs font-mono text-neutral-800 dark:text-neutral-300 break-all whitespace-pre-wrap border border-neutral-200 dark:border-white/10 max-h-32 overflow-y-auto">
                            {driveToken}
                        </pre>
                        <button
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-2 bg-white dark:bg-neutral-800 rounded-md shadow-sm border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                        </button>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                        <p className="text-xs text-yellow-800 dark:text-yellow-500 font-medium">
                            ⚠️ Keep this token secret! It gives access to your Google Drive.
                        </p>
                    </div>
                </div>
            </SimpleModal>

            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">{t.settingsPage.title}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t.settingsPage.description}</p>
                </div>

                {/* Profile Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-4">
                        {t.settingsPage.profile}
                    </h2>
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                        {/* Avatar */}
                        <div className="p-4 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative group">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="h-16 w-16 rounded-full object-cover border-2 border-white/10 group-hover:border-blue-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-600 dark:text-white border-2 border-neutral-300 dark:border-white/10 group-hover:border-blue-500 transition-colors">
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
                                    <div className="text-sm font-medium text-neutral-900 dark:text-white">{t.settingsPage.profilePicture}</div>
                                    <div className="text-xs text-neutral-400 mt-1">{t.settingsPage.uploadAvatar}</div>
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        {isEditing ? (
                            <div className="p-4 border-b border-neutral-100 dark:border-white/5">
                                <label className="text-sm text-neutral-500 dark:text-neutral-400">{t.settingsPage.name}</label>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        autoFocus
                                        className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        onClick={handleSaveName}
                                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        {t.save}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setTempName(name);
                                    setIsEditing(true);
                                }}
                                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors border-b border-neutral-100 dark:border-white/5"
                            >
                                <div className="text-left">
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.settingsPage.name}</div>
                                    <div className="text-neutral-900 dark:text-white mt-0.5">{name || "Not set"}</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500" />
                            </button>
                        )}

                        {/* Email */}
                        <div className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-white/5">
                            <div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">{t.settingsPage.email}</div>
                                <div className="text-neutral-900 dark:text-white mt-0.5">{user.email}</div>
                            </div>
                        </div>

                        {/* Profile Details Link */}
                        <Link href="/settings/profile">
                            <button className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                <div className="text-left">
                                    <div className="text-neutral-900 dark:text-white">Profile Details</div>
                                    <div className="text-sm text-neutral-400 mt-0.5">
                                        Phone, bio, and more
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-neutral-500" />
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Security Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-4">
                        {t.settingsPage.security}
                    </h2>
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden shadow-sm dark:shadow-none">
                        <Link href="/settings/security">
                            <button className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                                <div className="text-left">
                                    <div className="text-neutral-900 dark:text-white">{t.settingsPage.passwordEmail}</div>
                                    <div className="text-sm text-neutral-400 mt-0.5">
                                        {t.settingsPage.changePassword}
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
                        {t.settingsPage.notifications}
                    </h2>
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden divide-y divide-neutral-100 dark:divide-white/5 shadow-sm dark:shadow-none">
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-neutral-900 dark:text-white">{t.settingsPage.emailNotifications}</div>
                                <div className="text-sm text-neutral-400 mt-0.5">
                                    {t.settingsPage.courseUpdates}
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-200 dark:bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-neutral-900 dark:text-white">{t.settingsPage.courseReminders}</div>
                                <div className="text-sm text-neutral-400 mt-0.5">{t.settingsPage.dailyReminders}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-200 dark:bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <div className="text-neutral-900 dark:text-white">{t.settingsPage.achievements}</div>
                                <div className="text-sm text-neutral-400 mt-0.5">{t.settingsPage.badgesMilestones}</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-neutral-200 dark:bg-white/20 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-red-400 px-4">
                        {t.settingsPage.dangerZone}
                    </h2>
                    <div className="bg-red-500/10 rounded-xl border border-red-500/20 overflow-hidden">
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full p-4 flex items-center justify-between hover:bg-red-500/20 transition-colors"
                        >
                            <div className="text-left">
                                <div className="text-red-400 font-medium flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    {t.settingsPage.deleteAccount}
                                </div>
                                <div className="text-sm text-red-300/70 mt-0.5">
                                    {t.settingsPage.deleteWarning}
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
