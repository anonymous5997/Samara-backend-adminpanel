// Notification Service - Firebase Cloud Messaging
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Register for push notifications and get FCM token
export const registerForPushNotifications = async () => {
    try {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return { success: false, error: 'Physical device required' };
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return { success: false, error: 'Permission not granted' };
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#7c3aed',
            });
        }

        return { success: true, token };
    } catch (error) {
        console.error('Register for Push Notifications Error:', error);
        return { success: false, error: error.message };
    }
};

// Save FCM token to Firestore user document
export const saveFCMToken = async (userId, token) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date().toISOString(),
        });
        return { success: true };
    } catch (error) {
        console.error('Save FCM Token Error:', error);
        return { success: false, error: error.message };
    }
};

// Send notification to resident by flat number
export const sendNotificationToResident = async (flatNumber, visitorData) => {
    try {
        // Get residents for this flat
        const q = query(
            collection(db, 'users'),
            where('flatNumber', '==', flatNumber),
            where('role', '==', 'resident')
        );

        const snapshot = await getDocs(q);

        // Send notification to all residents in this flat
        const notifications = snapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            if (userData.fcmToken) {
                return await scheduleNotification(
                    'New Visitor Request',
                    `${visitorData.visitorName} wants to visit. Purpose: ${visitorData.purpose}`,
                    {
                        type: 'visitor_request',
                        visitorId: visitorData.visitorId,
                        ...visitorData
                    }
                );
            }
        });

        await Promise.all(notifications);
        return { success: true };
    } catch (error) {
        console.error('Send Notification to Resident Error:', error);
        return { success: false, error: error.message };
    }
};

// Send notification to guard
export const sendNotificationToGuard = async (guardId, visitorData) => {
    try {
        const userRef = doc(db, 'users', guardId);
        const userDoc = await getDocs(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.fcmToken) {
                const title = visitorData.status === 'approved'
                    ? 'Visitor Approved'
                    : 'Visitor Denied';
                const body = `${visitorData.visitorName} for Flat ${visitorData.flatNumber} has been ${visitorData.status}`;

                await scheduleNotification(title, body, {
                    type: 'visitor_update',
                    ...visitorData
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Send Notification to Guard Error:', error);
        return { success: false, error: error.message };
    }
};

// Schedule local notification
export const scheduleNotification = async (title, body, data = {}) => {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
        });
        return { success: true };
    } catch (error) {
        console.error('Schedule Notification Error:', error);
        return { success: false, error: error.message };
    }
};

// Setup notification listeners
export const setupNotificationListeners = (onNotificationReceived, onNotificationTapped) => {
    // Listener for notifications received while app is foregrounded
    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
        if (onNotificationReceived) {
            onNotificationReceived(notification);
        }
    });

    // Listener for when user taps on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        if (onNotificationTapped) {
            onNotificationTapped(response.notification);
        }
    });

    // Return cleanup function
    return () => {
        Notifications.removeNotificationSubscription(receivedListener);
        Notifications.removeNotificationSubscription(responseListener);
    };
};

// Get notification badge count
export const getBadgeCount = async () => {
    try {
        const count = await Notifications.getBadgeCountAsync();
        return count;
    } catch (error) {
        console.error('Get Badge Count Error:', error);
        return 0;
    }
};

// Set notification badge count
export const setBadgeCount = async (count) => {
    try {
        await Notifications.setBadgeCountAsync(count);
        return { success: true };
    } catch (error) {
        console.error('Set Badge Count Error:', error);
        return { success: false, error: error.message };
    }
};

export default {
    registerForPushNotifications,
    saveFCMToken,
    sendNotificationToResident,
    sendNotificationToGuard,
    scheduleNotification,
    setupNotificationListeners,
    getBadgeCount,
    setBadgeCount,
};
