import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp
} from "firebase/firestore";
import { getFirebaseDB, isFirebaseEnabled } from "./config";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: string;
    link?: string;
}

export const createNotification = async (
    userId: string,
    data: Omit<Notification, "id" | "userId" | "read" | "createdAt">
): Promise<string | null> => {
    if (!isFirebaseEnabled()) return null;
    const db = getFirebaseDB();
    if (!db) return null;

    try {
        const docRef = await addDoc(collection(db, "notifications"), {
            userId,
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating notification:", error);
        return null;
    }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    if (!isFirebaseEnabled()) return false;
    const db = getFirebaseDB();
    if (!db) return false;

    try {
        const docRef = doc(db, "notifications", notificationId);
        await updateDoc(docRef, {
            read: true,
        });
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
    if (!isFirebaseEnabled()) return false;
    const db = getFirebaseDB();
    if (!db) return false;

    try {
        await deleteDoc(doc(db, "notifications", notificationId));
        return true;
    } catch (error) {
        console.error("Error deleting notification:", error);
        return false;
    }
};

export const getNotificationsForUser = async (userId: string, maxLimit = 50): Promise<Notification[]> => {
    if (!isFirebaseEnabled()) return [];
    const db = getFirebaseDB();
    if (!db) return [];

    try {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(maxLimit)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
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
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};
