import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseEnabled } from './firebase';
import { Match } from '@/types/match';

const COLLECTION_NAME = 'matches';

// Sync match to Firebase for sharing
export const syncMatchToFirebase = async (match: Match): Promise<boolean> => {
  if (!isFirebaseEnabled()) {
    console.warn('Firebase not configured. Sharing disabled.');
    return false;
  }

  try {
    await setDoc(doc(db!, COLLECTION_NAME, match.id), match);
    return true;
  } catch (error) {
    console.error('Error syncing match to Firebase:', error);
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
    return null;
  }

  try {
    const docRef = doc(db!, COLLECTION_NAME, matchId);
    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          onUpdate(doc.data() as Match);
        }
      },
      (error) => {
        console.error('Error listening to match updates:', error);
        onError?.(error);
      }
    );
  } catch (error) {
    console.error('Error setting up match subscription:', error);
    return null;
  }
};
