// Role Service - User role management
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    updateDoc,
    getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

const USERS_COLLECTION = 'users';

// Get all users by role (Admin)
export const getUsersByRole = async (role) => {
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            where('role', '==', role)
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, users };
    } catch (error) {
        console.error('Get Users by Role Error:', error);
        return { success: false, error: error.message, users: [] };
    }
};

// Get all users (Admin)
export const getAllUsers = async () => {
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));
        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, users };
    } catch (error) {
        console.error('Get All Users Error:', error);
        return { success: false, error: error.message, users: [] };
    }
};

// Update user role (Admin only)
export const updateUserRole = async (userId, newRole) => {
    try {
        const validRoles = ['admin', 'guard', 'resident'];

        if (!validRoles.includes(newRole)) {
            return { success: false, error: 'Invalid role' };
        }

        const userRef = doc(db, USERS_COLLECTION, userId);
        await updateDoc(userRef, {
            role: newRole,
            roleUpdatedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch (error) {
        console.error('Update User Role Error:', error);
        return { success: false, error: error.message };
    }
};

// Verify user has required role
export const verifyAccess = async (userId, requiredRole) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { hasAccess: false, error: 'User not found' };
        }

        const userData = userDoc.data();

        // Admin has access to everything
        if (userData.role === 'admin') {
            return { hasAccess: true, role: 'admin' };
        }

        // Check if user has required role
        const hasAccess = userData.role === requiredRole;
        return { hasAccess, role: userData.role };
    } catch (error) {
        console.error('Verify Access Error:', error);
        return { hasAccess: false, error: error.message };
    }
};

// Check if user is admin
export const isAdmin = async (userId) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return false;
        }

        return userDoc.data().role === 'admin';
    } catch (error) {
        console.error('Is Admin Error:', error);
        return false;
    }
};

// Get user statistics (Admin)
export const getUserStatistics = async () => {
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION));

        const stats = {
            total: snapshot.size,
            admins: 0,
            guards: 0,
            residents: 0,
        };

        snapshot.forEach(doc => {
            const role = doc.data().role;
            if (role === 'admin') stats.admins++;
            else if (role === 'guard') stats.guards++;
            else if (role === 'resident') stats.residents++;
        });

        return { success: true, stats };
    } catch (error) {
        console.error('Get User Statistics Error:', error);
        return {
            success: false,
            error: error.message,
            stats: { total: 0, admins: 0, guards: 0, residents: 0 }
        };
    }
};

export default {
    getUsersByRole,
    getAllUsers,
    updateUserRole,
    verifyAccess,
    isAdmin,
    getUserStatistics,
};
