import { db } from './firebase';
import {
    doc, getDoc, writeBatch, increment,
    query, collection, where, getDocs, limit, serverTimestamp, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { storage } from './firebase';
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage';


export interface UserProfile extends Record<string, any> {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
    bio?: string;
    followerCount: number;
    followingCount: number;
    isFollowing?: boolean;
}


export const followUser = async (currentUser: User, targetUserId: string) => {
    
    if (!currentUser || !targetUserId || currentUser.uid === targetUserId) {
        console.error("followUser: Datos inválidos o intento de auto-seguimiento.");
        
        return Promise.reject(new Error("Datos de usuario inválidos."));
    }

    const currentUserId = currentUser.uid;

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const followingRef = doc(db, `users/${currentUserId}/following`, targetUserId);
    const followersRef = doc(db, `users/${targetUserId}/followers`, currentUserId);
    const notificationRef = doc(collection(db, `users/${targetUserId}/notifications`));

    const batch = writeBatch(db);

    batch.set(followingRef, { timestamp: serverTimestamp() });
    batch.set(followersRef, { timestamp: serverTimestamp() });
    batch.set(currentUserRef, { followingCount: increment(1) }, { merge: true });
    batch.set(targetUserRef, { followerCount: increment(1) }, { merge: true });

    
    batch.set(notificationRef, {
        type: 'new_follower',
        fromUserId: currentUserId,
        fromUserName: currentUser.displayName || "Un usuario",
        fromUserPhotoURL: currentUser.photoURL || "",
        timestamp: serverTimestamp(),
        read: false,
    });

    
    await batch.commit();
};


export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
    if (currentUserId === targetUserId) return;

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const followingRef = doc(db, `users/${currentUserId}/following`, targetUserId);
    const followersRef = doc(db, `users/${targetUserId}/followers`, currentUserId);

    const batch = writeBatch(db);

    batch.delete(followingRef);
    batch.delete(followersRef);
    batch.set(currentUserRef, { followingCount: increment(-1) }, { merge: true });
    batch.set(targetUserRef, { followerCount: increment(-1) }, { merge: true });

    await batch.commit();
};


export const getUserProfile = async (userId: string, currentUserId?: string): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) return null;

    const profileData = userDocSnap.data() as UserProfile;

    if (currentUserId && currentUserId !== userId) {
        const followingDoc = await getDoc(doc(db, `users/${currentUserId}/following`, userId));
        profileData.isFollowing = followingDoc.exists();
    }

    return profileData;
};

export const adminUpdateUserProfile = async (adminUser: User, targetUserId: string, updates: Partial<{ displayName: string; photoURL: string; bio: string }>) => {
    if (!adminUser || !targetUserId) throw new Error('Invalid params');
    
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, updates);
};

export const assignBadgeToUser = async (adminUser: User, targetUserId: string, badge: { id: string; name: string; imgUrl?: string }) => {
    if (!adminUser || !targetUserId) throw new Error('Invalid params');
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, { badges: arrayUnion(badge) });
};

export const removeBadgeFromUser = async (adminUser: User, targetUserId: string, badge: { id: string; name: string; imgUrl?: string }) => {
    if (!adminUser || !targetUserId) throw new Error('Invalid params');
    const targetRef = doc(db, 'users', targetUserId);
    await updateDoc(targetRef, { badges: arrayRemove(badge) });
};

export const uploadBadgeImage = async (uploader: User, file: File): Promise<string> => {
    if (!uploader) throw new Error('Invalid uploader');
    const path = `badges/${uploader.uid}/${Date.now()}_${file.name}`;
    const r = sRef(storage, path);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    return url;
};


export const searchUsers = async (searchText: string): Promise<UserProfile[]> => {
    if (!searchText.trim()) return [];

    const usersRef = collection(db, "users");
    const q = query(
        usersRef,
        where('displayName', '>=', searchText),
        where('displayName', '<=', searchText + '\uf8ff'),
        limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};


export const getFollowingList = async (userId: string): Promise<UserProfile[]> => {
    const followingRef = collection(db, `users/${userId}/following`);
    const followingSnapshot = await getDocs(followingRef);

    if (followingSnapshot.empty) return [];

    const followingIds = followingSnapshot.docs.map(doc => doc.id);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', 'in', followingIds));
    const usersSnapshot = await getDocs(q);

    return usersSnapshot.docs.map(doc => doc.data() as UserProfile);
};


export const getFollowersList = async (userId: string): Promise<UserProfile[]> => {
    const followersRef = collection(db, `users/${userId}/followers`);
    const followersSnapshot = await getDocs(followersRef);

    if (followersSnapshot.empty) return [];

    const followerIds = followersSnapshot.docs.map(doc => doc.id);

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', 'in', followerIds));
    const usersSnapshot = await getDocs(q);

    return usersSnapshot.docs.map(doc => doc.data() as UserProfile);
};
