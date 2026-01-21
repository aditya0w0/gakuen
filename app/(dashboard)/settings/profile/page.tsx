"use client";

import { authenticatedFetch } from "@/lib/api/authenticated-fetch";

import { useAuth } from "@/components/auth/AuthContext";
import { hybridStorage } from "@/lib/storage/hybrid-storage";
import { syncManager } from "@/lib/storage/sync-manager";
import { ChevronLeft, Camera, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import Image from "next/image";

export default function ProfileDetailsPage() {
    const { user, refreshUser } = useAuth();
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ username?: string; firstName?: string; lastName?: string; phone?: string }>({});

    // Avatar upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Cropper modal state
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setUsername(user.username || "");
            setPhone(user.phone || "");
            setBio(user.bio || "");
            setFirstName(user.firstName || "");
            setLastName(user.lastName || "");
            setAvatarUrl(user.avatar || null);
        }
    }, [user]);

    // Handle file selection - open cropper
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create object URL for cropper preview
        const imageUrl = URL.createObjectURL(file);
        setSelectedImageUrl(imageUrl);
        setCropperOpen(true);

        // Reset file input so same file can be selected again
        e.target.value = "";
    };

    // Handle cropped image upload
    const handleCroppedUpload = async (blob: Blob) => {
        if (!user) return;

        setCropperOpen(false);
        const previousAvatar = avatarUrl;

        setIsUploading(true);
        try {
            // Convert blob to File
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

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

            const data = await res.json();

            // Update UI immediately (optimistic)
            setAvatarUrl(data.url);

            // Update user profile in storage/DB
            await hybridStorage.profile.update(user.id, { avatar: data.url });

            // Force immediate sync to Firestore (don't wait for 30s debounce)
            await syncManager.syncNow();

            // Refresh user in context so sidebar updates instantly
            await refreshUser();

            setSaveMessage("Avatar updated successfully!");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error: any) {
            console.error(error);
            // Rollback to previous avatar on failure
            setAvatarUrl(previousAvatar);
            setSaveMessage(error.message || "Failed to upload avatar");
        } finally {
            setIsUploading(false);
            // Clean up object URL
            if (selectedImageUrl) {
                URL.revokeObjectURL(selectedImageUrl);
                setSelectedImageUrl(null);
            }
        }
    };

    const validateForm = (): boolean => {
        // ... existing validation
        const newErrors: typeof errors = {};

        // Validate first name - letters, spaces, hyphens only
        if (firstName && !/^[a-zA-Z\s-]+$/.test(firstName)) {
            newErrors.firstName = "Only letters, spaces, and hyphens allowed";
        }

        // Validate last name
        if (lastName && !/^[a-zA-Z\s-]+$/.test(lastName)) {
            newErrors.lastName = "Only letters, spaces, and hyphens allowed";
        }

        // Validate phone - must be 8-20 digits (allowing spaces, hyphens, parentheses)
        if (phone && !/^[\d\s\-()]{8,20}$/.test(phone)) {
            newErrors.phone = "Invalid phone number (8-20 digits required)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e: React.FormEvent) => {
        // ... existing handleSave
        e.preventDefault();
        if (!user) return;

        if (!validateForm()) {
            setSaveMessage("Please fix the errors above");
            setTimeout(() => setSaveMessage(null), 3000);
            return;
        }

        setIsSaving(true);
        setSaveMessage(null);

        try {
            await hybridStorage.profile.update(user.id, {
                username,
                phone,
                bio,
                firstName,
                lastName,
            });

            // Refresh user in context so sidebar updates instantly
            await refreshUser();

            setSaveMessage("Profile updated successfully!");
            setTimeout(() => setSaveMessage(null), 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setSaveMessage("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return <div className="flex justify-center items-center h-[50vh] text-neutral-400">Loading...</div>;
    }

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <a href="/settings" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                        <ChevronLeft className="w-6 h-6" />
                    </a>
                    <div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Profile Details</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage your personal information</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden divide-y divide-neutral-100 dark:divide-white/5">

                        {/* Avatar Section */}
                        <div className="p-6 flex flex-col items-center border-b border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-white/5">
                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-neutral-900 shadow-lg">
                                    {avatarUrl ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={avatarUrl}
                                                alt="Profile"
                                                fill
                                                className="object-cover"
                                                sizes="96px"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                                            {firstName?.[0] || user.name?.[0] || "U"}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-white" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    disabled={isUploading}
                                />
                            </div>
                            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                                Click to upload new avatar
                            </p>
                        </div>
                        {/* Name - grouped */}
                        <div className="p-4">
                            <label className="text-sm text-neutral-500 dark:text-neutral-400 block mb-2">Name</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                                        }}
                                        placeholder="First name"
                                        className={`w-full px-3 py-2 bg-neutral-50 dark:bg-white/5 border ${errors.firstName ? 'border-red-500' : 'border-neutral-200 dark:border-white/10'} rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.firstName && (
                                        <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                                    )}
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            if (errors.lastName) setErrors({ ...errors, lastName: undefined });
                                        }}
                                        placeholder="Last name"
                                        className={`w-full px-3 py-2 bg-neutral-50 dark:bg-white/5 border ${errors.lastName ? 'border-red-500' : 'border-neutral-200 dark:border-white/10'} rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    />
                                    {errors.lastName && (
                                        <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Username */}
                        <div className="p-4">
                            <label className="text-sm text-neutral-500 dark:text-neutral-400 block mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value.toLowerCase());
                                    if (errors.username) setErrors({ ...errors, username: undefined });
                                }}
                                placeholder="johndoe123"
                                className={`w-full px-3 py-2 bg-neutral-50 dark:bg-white/5 border ${errors.username ? 'border-red-500' : 'border-neutral-200 dark:border-white/10'} rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            {errors.username && (
                                <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                            )}
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Used for your profile URL</p>
                        </div>
                        <div className="p-4">
                            <label className="text-sm text-neutral-500 dark:text-neutral-400">Phone</label>
                            <div className="mt-2">
                                <PhoneInput
                                    value={phone}
                                    onChange={(val) => {
                                        setPhone(val);
                                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                                    }}
                                    placeholder="123 456 7890"
                                />
                                {errors.phone && (
                                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <label className="text-sm text-neutral-500 dark:text-neutral-400">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={4}
                                placeholder="Tell us about yourself..."
                                className="w-full mt-2 px-0 py-1 bg-transparent border-none text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {saveMessage && (
                        <div className={`p-3 rounded-lg text-sm ${saveMessage.includes("success") ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-red-500/20 text-red-600 dark:text-red-400"}`}>
                            {saveMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>

            {/* Image Cropper Modal */}
            {selectedImageUrl && (
                <ImageCropperModal
                    imageUrl={selectedImageUrl}
                    isOpen={cropperOpen}
                    onClose={() => {
                        setCropperOpen(false);
                        URL.revokeObjectURL(selectedImageUrl);
                        setSelectedImageUrl(null);
                    }}
                    onApply={handleCroppedUpload}
                />
            )}
        </div>
    );
}
