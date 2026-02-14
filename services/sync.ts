import { db, auth } from '../utils/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Habit, HabitLog } from '../store/habit-store';

const USERS_COLLECTION = 'users';

export const SyncService = {
    // Save user profile data
    async saveUserProfile(userId: string, data: any) {
        if (!userId) return;
        try {
            await setDoc(doc(db, USERS_COLLECTION, userId), data, { merge: true });
        } catch (error) {
            console.error('Error syncing profile:', error);
        }
    },

    // Save entire habit state (simple overwrite for MVP)
    async syncHabits(userId: string, habits: Habit[]) {
        if (!userId) return;
        try {
            // We store habits as a subcollection or a field. 
            // array of objects in a field is limited by doc size (1MB).
            // For MVP with < 100 habits, a field is fine.
            await setDoc(doc(db, USERS_COLLECTION, userId), { habits }, { merge: true });
        } catch (error) {
            console.error('Error syncing habits:', error);
        }
    },

    // Save logs (history)
    async syncLogs(userId: string, logs: HabitLog) {
        if (!userId) return;
        try {
            await setDoc(doc(db, USERS_COLLECTION, userId), { logs }, { merge: true });
        } catch (error) {
            console.error('Error syncing logs:', error);
        }
    },

    // Pull data from Firestore
    async pullData(userId: string) {
        if (!userId) return null;
        try {
            const docSnap = await getDoc(doc(db, USERS_COLLECTION, userId));
            if (docSnap.exists()) {
                return docSnap.data();
            }
            return null;
        } catch (error) {
            console.error('Error pulling data:', error);
            return null;
        }
    }
};
