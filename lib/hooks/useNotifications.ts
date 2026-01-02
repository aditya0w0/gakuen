"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { getFirebaseDB, isFirebaseEnabled } from "@/lib/firebase/config";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { Notification } from "@/lib/firebase/notifications";

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !isFirebaseEnabled()) {
            setLoading(false);
            setNotifications([]);
            return;
        }

        const db = getFirebaseDB();
        if (!db) return;

        // Create query
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.id),
            orderBy("createdAt", "desc"),
            limit(50)
        );

        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    userId: data.userId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    read: data.read,
                    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : new Date().toISOString(),
                    link: data.link,
                };
            }) as Notification[];
            setNotifications(newNotifications);
            setLoading(false);
        }, (error) => {
            console.error("Notification subscription error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" });
        } catch (error) {
            console.error("Failed to mark as read:", error);
            // Revert on error (optional, but keep it simple for now)
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        if (unread.length === 0) return;

        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        // Call API for each (parallel)
        // In robust app, we'd have a batch endpoint
        await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: "POST" })));
    };

    const deleteNotification = async (id: string) => {
        // Optimistic
        setNotifications(prev => prev.filter(n => n.id !== id));

        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    return {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount: notifications.filter(n => !n.read).length
    };
}
