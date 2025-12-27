"use client";

import { useAuth } from "@/components/auth/AuthContext";
import { firebaseAuth } from "@/lib/firebase/auth";
import { ChevronLeft, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

type Section = "menu" | "password" | "email";

export default function SecurityPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [section, setSection] = useState<Section>("menu");

    // Password state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Email state
    const [newEmail, setNewEmail] = useState("");
    const [emailPassword, setEmailPassword] = useState("");
    const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
    const [isChangingEmail, setIsChangingEmail] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: "error", text: "Passwords don't match" });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        setIsChangingPassword(true);

        try {
            const firebaseUser = firebaseAuth.getCurrentUser();
            if (!firebaseUser || !user?.email) throw new Error("Not authenticated");

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);

            setPasswordMessage({ type: "success", text: "Password updated!" });
            setTimeout(() => setSection("menu"), 1500);
        } catch (error: any) {
            if (error.code === "auth/wrong-password") {
                setPasswordMessage({ type: "error", text: "Current password is incorrect" });
            } else {
                setPasswordMessage({ type: "error", text: error.message || "Failed to update password" });
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleChangeEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setEmailMessage(null);

        if (!newEmail.includes("@")) {
            setEmailMessage({ type: "error", text: "Invalid email address" });
            return;
        }

        setIsChangingEmail(true);

        try {
            const firebaseUser = firebaseAuth.getCurrentUser();
            if (!firebaseUser || !user?.email) throw new Error("Not authenticated");

            const credential = EmailAuthProvider.credential(user.email, emailPassword);
            await reauthenticateWithCredential(firebaseUser, credential);
            await updateEmail(firebaseUser, newEmail);

            setEmailMessage({ type: "success", text: "Email updated!" });
            setTimeout(() => {
                setSection("menu");
                router.refresh();
            }, 1500);
        } catch (error: any) {
            if (error.code === "auth/wrong-password") {
                setEmailMessage({ type: "error", text: "Password is incorrect" });
            } else if (error.code === "auth/email-already-in-use") {
                setEmailMessage({ type: "error", text: "Email already in use" });
            } else {
                setEmailMessage({ type: "error", text: error.message || "Failed to update email" });
            }
        } finally {
            setIsChangingEmail(false);
        }
    };

    if (!user) {
        return <div className="flex justify-center items-center h-[50vh] text-neutral-400">Loading...</div>;
    }

    const renderMenu = () => (
        <div className="space-y-2">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                <button
                    onClick={() => setSection("password")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="text-left">
                        <div className="text-white">Password</div>
                        <div className="text-sm text-neutral-400 mt-0.5">••••••••</div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-neutral-500 rotate-180" />
                </button>

                <button
                    onClick={() => setSection("email")}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                    <div className="text-left">
                        <div className="text-white">Email</div>
                        <div className="text-sm text-neutral-400 mt-0.5">{user.email}</div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-neutral-500 rotate-180" />
                </button>
            </div>
        </div>
    );

    const renderPasswordForm = () => (
        <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                <div className="p-4">
                    <label className="text-sm text-neutral-400">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full mt-2 px-0 py-1 bg-transparent border-none text-white focus:outline-none"
                    />
                </div>
                <div className="p-4">
                    <label className="text-sm text-neutral-400">New Password</label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full mt-2 px-0 py-1 bg-transparent border-none text-white focus:outline-none"
                    />
                </div>
                <div className="p-4">
                    <label className="text-sm text-neutral-400">Verify Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full mt-2 px-0 py-1 bg-transparent border-none text-white focus:outline-none"
                    />
                </div>
            </div>

            {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${passwordMessage.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {passwordMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm">{passwordMessage.text}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
            >
                {isChangingPassword ? "Updating..." : "Change Password"}
            </button>
        </form>
    );

    const renderEmailForm = () => (
        <form onSubmit={handleChangeEmail} className="space-y-4">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden divide-y divide-white/5">
                <div className="p-4">
                    <label className="text-sm text-neutral-400">New Email</label>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required
                        placeholder={user.email}
                        className="w-full mt-2 px-0 py-1 bg-transparent border-none text-white placeholder:text-neutral-600 focus:outline-none"
                    />
                </div>
                <div className="p-4">
                    <label className="text-sm text-neutral-400">Password</label>
                    <input
                        type="password"
                        value={emailPassword}
                        onChange={(e) => setEmailPassword(e.target.value)}
                        required
                        className="w-full mt-2 px-0 py-1 bg-transparent border-none text-white focus:outline-none"
                    />
                    <p className="text-xs text-neutral-500 mt-2">Enter your password to confirm</p>
                </div>
            </div>

            {emailMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${emailMessage.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {emailMessage.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm">{emailMessage.text}</span>
                </div>
            )}

            <button
                type="submit"
                disabled={isChangingEmail}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium transition-colors"
            >
                {isChangingEmail ? "Updating..." : "Change Email"}
            </button>
        </form>
    );

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-2xl space-y-6">
                <div className="flex items-center gap-4">
                    {section !== "menu" && (
                        <button onClick={() => setSection("menu")} className="text-blue-400 hover:text-blue-300">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            {section === "menu" ? "Security" : section === "password" ? "Change Password" : "Change Email"}
                        </h1>
                        <p className="text-neutral-400 mt-1">
                            {section === "menu" ? "Manage your account security" : "Keep your account secure"}
                        </p>
                    </div>
                </div>

                {section === "menu" && renderMenu()}
                {section === "password" && renderPasswordForm()}
                {section === "email" && renderEmailForm()}
            </div>
        </div>
    );
}
