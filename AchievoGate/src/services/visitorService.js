// Visitor Service - Firestore CRUD operations
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { sendNotificationToResident, sendNotificationToGuard } from './notificationService';

const VISITORS_COLLECTION = 'visitors';

// Create new visitor entry (Guard only)
export const createVisitor = async (visitorData, guardId) => {
    try {
        const visitor = {
            ...visitorData,
            guardId,
            status: 'pending',
            createdAt: serverTimestamp(),
            approvedAt: null,
            photoUrl: visitorData.photoUrl || '',
        };

        const docRef = await addDoc(collection(db, VISITORS_COLLECTION), visitor);

        // Send notification to resident
        await sendNotificationToResident(
            visitorData.flatNumber,
            {
                visitorName: visitorData.visitorName,
                purpose: visitorData.purpose,
                visitorId: docRef.id,
            }
        );

        return { success: true, visitorId: docRef.id };
    } catch (error) {
        console.error('Create Visitor Error:', error);
        return { success: false, error: error.message };
    }
};

// Get pending visitors for a specific flat (Resident)
export const getPendingVisitors = (flatNumber, callback) => {
    try {
        const q = query(
            collection(db, VISITORS_COLLECTION),
            where('flatNumber', '==', flatNumber),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const visitors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(visitors);
        });
    } catch (error) {
        console.error('Get Pending Visitors Error:', error);
        callback([]);
        return () => { };
    }
};

// Get all pending approvals (Guard)
export const getAllPendingVisitors = (callback) => {
    try {
        const q = query(
            collection(db, VISITORS_COLLECTION),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const visitors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(visitors);
        });
    } catch (error) {
        console.error('Get All Pending Visitors Error:', error);
        callback([]);
        return () => { };
    }
};

// Get approved visitors (Guard)
export const getApprovedVisitors = (callback) => {
    try {
        const q = query(
            collection(db, VISITORS_COLLECTION),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const visitors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(visitors);
        });
    } catch (error) {
        console.error('Get Approved Visitors Error:', error);
        callback([]);
        return () => { };
    }
};

// Approve visitor (Resident)
export const approveVisitor = async (visitorId, residentId) => {
    try {
        const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
        await updateDoc(visitorRef, {
            status: 'approved',
            residentId,
            approvedAt: serverTimestamp(),
        });

        // Get visitor data to send notification to guard
        const visitorDoc = await getDoc(visitorRef);
        if (visitorDoc.exists()) {
            const visitorData = visitorDoc.data();
            await sendNotificationToGuard(
                visitorData.guardId,
                {
                    visitorName: visitorData.visitorName,
                    flatNumber: visitorData.flatNumber,
                    status: 'approved',
                }
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Approve Visitor Error:', error);
        return { success: false, error: error.message };
    }
};

// Deny visitor (Resident)
export const denyVisitor = async (visitorId, residentId) => {
    try {
        const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
        await updateDoc(visitorRef, {
            status: 'denied',
            residentId,
            deniedAt: serverTimestamp(),
        });

        // Get visitor data to send notification to guard
        const visitorDoc = await getDoc(visitorRef);
        if (visitorDoc.exists()) {
            const visitorData = visitorDoc.data();
            await sendNotificationToGuard(
                visitorData.guardId,
                {
                    visitorName: visitorData.visitorName,
                    flatNumber: visitorData.flatNumber,
                    status: 'denied',
                }
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Deny Visitor Error:', error);
        return { success: false, error: error.message };
    }
};

// Mark visitor as entered (Guard)
export const markVisitorEntered = async (visitorId) => {
    try {
        const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
        await updateDoc(visitorRef, {
            status: 'entered',
            enteredAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Mark Visitor Entered Error:', error);
        return { success: false, error: error.message };
    }
};

// Mark visitor as exited (Guard)
export const markVisitorExited = async (visitorId) => {
    try {
        const visitorRef = doc(db, VISITORS_COLLECTION, visitorId);
        await updateDoc(visitorRef, {
            status: 'exited',
            exitedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error('Mark Visitor Exited Error:', error);
        return { success: false, error: error.message };
    }
};

// Get visitor history for a flat (Resident)
export const getVisitorHistory = async (flatNumber) => {
    try {
        const q = query(
            collection(db, VISITORS_COLLECTION),
            where('flatNumber', '==', flatNumber),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const visitors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { success: true, visitors };
    } catch (error) {
        console.error('Get Visitor History Error:', error);
        return { success: false, error: error.message, visitors: [] };
    }
};

// Get all visitors (Admin)
export const getAllVisitors = (callback) => {
    try {
        const q = query(
            collection(db, VISITORS_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const visitors = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(visitors);
        });
    } catch (error) {
        console.error('Get All Visitors Error:', error);
        callback([]);
        return () => { };
    }
};

export default {
    createVisitor,
    getPendingVisitors,
    getAllPendingVisitors,
    getApprovedVisitors,
    approveVisitor,
    denyVisitor,
    markVisitorEntered,
    markVisitorExited,
    getVisitorHistory,
    getAllVisitors,
};
