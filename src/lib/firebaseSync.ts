import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseEnabled } from './firebase';
import { Match } from '@/types/match';

const COLLECTION_NAME = 'matches';

// Remove undefined values from object (Firebase doesn't allow undefined)
const sanitizeForFirebase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirebase(value);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Sync match to Firebase for sharing
export const syncMatchToFirebase = async (match: Match): Promise<boolean> => {
  if (!isFirebaseEnabled()) {
    console.warn('⚠️ Firebase not configured. Sharing disabled.');
    return false;
  }

  try {
    console.log('🔄 Syncing match to Firebase:', match.id);
    // Remove undefined values before syncing (Firebase doesn't support undefined)
    const sanitizedMatch = sanitizeForFirebase(match);
    // Use merge for faster updates (only sends changed fields)
    await setDoc(doc(db!, COLLECTION_NAME, match.id), sanitizedMatch, { merge: true });
    console.log('✅ Match synced successfully:', match.id);
    return true;
  } catch (error) {
    console.error('❌ Error syncing match to Firebase:', error);
    return false;
  }
};

// Get match from Firebase
export const getMatchFromFirebase = async (matchId: string): Promise<Match | null> => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  try {
    const docRef = doc(db!, COLLECTION_NAME, matchId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Match;
    }
    return null;
  } catch (error) {
    console.error('Error getting match from Firebase:', error);
    return null;
  }
};

// Subscribe to real-time match updates
export const subscribeToMatch = (
  matchId: string,
  onUpdate: (match: Match) => void,
  onError?: (error: Error) => void
): Unsubscribe | null => {
  if (!isFirebaseEnabled()) {
    console.warn('⚠️ Firebase not enabled. Real-time updates disabled.');
    return null;
  }

  try {
    console.log('🎧 Setting up real-time listener for match:', matchId);
    const docRef = doc(db!, COLLECTION_NAME, matchId);
    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          console.log('📡 Received real-time update for match:', matchId);
          onUpdate(doc.data() as Match);
        } else {
          console.warn('⚠️ Match document not found:', matchId);
        }
      },
      (error) => {
        console.error('❌ Error listening to match updates:', error);
        onError?.(error);
      }
    );
  } catch (error) {
    console.error('❌ Error setting up match subscription:', error);
    return null;
  }
};
