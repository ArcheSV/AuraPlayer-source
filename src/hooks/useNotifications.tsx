import { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export interface Notification {
    id: string;
    type: 'new_follower';
    fromUserId: string;
    fromUserName: string;
    fromUserPhotoURL: string;
    timestamp: any;
    read: boolean;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        let unsubSnapshot: (() => void) | null = null;

        const handleUser = (user: User | null) => {
            if (!user) {
                
                setNotifications([]);
                setUnreadCount(0);
                if (unsubSnapshot) {
                    try { unsubSnapshot(); } catch {};
                    unsubSnapshot = null;
                }
                return;
            }

            const notificationsRef = collection(db, `users/${user.uid}/notifications`);
            const q = query(notificationsRef, orderBy('timestamp', 'desc'), limit(20));

            unsubSnapshot = onSnapshot(q, (snapshot) => {
                const newNotifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Notification));

                setNotifications(newNotifications);
                setUnreadCount(newNotifications.filter(n => !n.read).length);
            });
        };

        const unsubAuth = onAuthStateChanged(auth, (u) => handleUser(u));

        
        handleUser(auth.currentUser);

        return () => {
            if (unsubSnapshot) {
                try { unsubSnapshot(); } catch {};
            }
            unsubAuth();
        };
    }, []);

    return { notifications, unreadCount };
};
