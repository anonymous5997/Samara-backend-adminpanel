// Authentication Service - Firebase Phone OTP
import {
    PhoneAuthProvider,
    signInWithCredential,
    signOut,
    onAuthStateChanged,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

const SESSION_KEY = '@achievogate_session';
const USER_ROLE_KEY = '@achievogate_user_role';

// Send OTP to phone number
export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
    try {
        // Phone number should be in E.164 format (+1234567890)
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

        const provider = new PhoneAuthProvider(auth);
        const verificationId = await provider.verifyPhoneNumber(
            formattedPhone,
            recaptchaVerifier
        );

        return { success: true, verificationId };
    } catch (error) {
        console.error('Send OTP Error:', error);
        return { success: false, error: error.message };
    }
};

// Verify OTP and sign in
export const verifyOTP = async (verificationId, code) => {
    try {
        const credential = PhoneAuthProvider.credential(verificationId, code);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        // Save session
        await persistSession(user.uid, user.phoneNumber);

        // Get or create user role
        const userRole = await getUserRole(user.uid, user.phoneNumber);

        return {
            success: true,
            user,
            role: userRole
        };
    } catch (error) {
        console.error('Verify OTP Error:', error);
        return { success: false, error: error.message };
    }
};

// Get user role from Firestore
export const getUserRole = async (userId, phoneNumber = null) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            await AsyncStorage.setItem(USER_ROLE_KEY, userData.role);
            return userData.role;
        } else {
            // Create new user with default role 'resident'
            const newUser = {
                id: userId,
                phone: phoneNumber,
                role: 'resident',
                name: '',
                societyId: 'default_society',
                flatNumber: '',
                fcmToken: '',
                createdAt: new Date().toISOString(),
            };

            await setDoc(userDocRef, newUser);
            await AsyncStorage.setItem(USER_ROLE_KEY, 'resident');
            return 'resident';
        }
    } catch (error) {
        console.error('Get User Role Error:', error);
        return 'resident'; // Default fallback
    }
};

// Get current user data
export const getCurrentUserData = async () => {
    try {
        const user = auth.currentUser;
        if (!user) return null;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return { id: user.uid, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Get Current User Data Error:', error);
        return null;
    }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            ...updates,
            updatedAt: new Date().toISOString(),
        });
        return { success: true };
    } catch (error) {
        console.error('Update User Profile Error:', error);
        return { success: false, error: error.message };
    }
};

// Persist session to AsyncStorage
export const persistSession = async (userId, phoneNumber) => {
    try {
        const sessionData = {
            userId,
            phoneNumber,
            timestamp: new Date().toISOString(),
        };
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        return { success: true };
    } catch (error) {
        console.error('Persist Session Error:', error);
        return { success: false, error: error.message };
    }
};

// Get persisted session
export const getSession = async () => {
    try {
        const sessionString = await AsyncStorage.getItem(SESSION_KEY);
        if (sessionString) {
            return JSON.parse(sessionString);
        }
        return null;
    } catch (error) {
        console.error('Get Session Error:', error);
        return null;
    }
};

// Get cached user role
export const getCachedUserRole = async () => {
    try {
        const role = await AsyncStorage.getItem(USER_ROLE_KEY);
        return role || null;
    } catch (error) {
        console.error('Get Cached User Role Error:', error);
        return null;
    }
};

// Logout
export const logout = async () => {
    try {
        await signOut(auth);
        await AsyncStorage.removeItem(SESSION_KEY);
        await AsyncStorage.removeItem(USER_ROLE_KEY);
        return { success: true };
    } catch (error) {
        console.error('Logout Error:', error);
        return { success: false, error: error.message };
    }
};

// Auth state observer
export const observeAuthState = (callback) => {
    return onAuthStateChanged(auth, callback);
};

export default {
    sendOTP,
    verifyOTP,
    getUserRole,
    getCurrentUserData,
    updateUserProfile,
    persistSession,
    getSession,
    getCachedUserRole,
    logout,
    observeAuthState,
};
