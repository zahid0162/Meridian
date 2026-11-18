import type { User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  CareerAssessment,
  FuturePrediction,
  ModelId,
  PersonalProfile,
  UserAccount,
} from '../types/intelligence';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import {
  generateSafeId,
  sanitizeCareerAssessmentForWrite,
  sanitizeFuturePredictionForWrite,
  sanitizeProfilePayload,
} from './firestoreValidation';

export async function ensureUserAccount(user: User): Promise<UserAccount> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserAccount;
    }

    const rawName = (user.displayName || '').trim() || (user.email?.split('@')[0] || '').trim() || 'Account Holder';
    const newAccount: UserAccount = {
      uid: user.uid,
      email: (user.email || 'user@example.com').trim().slice(0, 254),
      displayName: rawName.slice(0, 120),
      parentalConsentAccepted: false,
      preferredModel: 'Qwen/Qwen3-8B',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, newAccount);
    return newAccount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserSettings(
  uid: string,
  updates: Partial<Pick<UserAccount, 'displayName' | 'parentalConsentAccepted' | 'preferredModel'>>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

function toMillis(ts: unknown): number {
  if (ts && typeof ts === 'object' && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function subscribeProfiles(
  uid: string,
  onData: (profiles: PersonalProfile[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/profiles`;
  const q = query(
    collection(db, 'users', uid, 'profiles'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => d.data() as PersonalProfile)
        .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function saveProfile(
  uid: string,
  profileInput: Omit<PersonalProfile, 'id' | 'ownerId' | 'completenessScore' | 'createdAt' | 'updatedAt'>,
  existingId?: string
): Promise<string> {
  const profileId = existingId || generateSafeId('prof');
  const path = `users/${uid}/profiles/${profileId}`;
  const sanitized = sanitizeProfilePayload(profileInput);

  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await ensureUserAccount(auth.currentUser);
    }
    if (existingId) {
      await updateDoc(doc(db, 'users', uid, 'profiles', profileId), {
        relationship: sanitized.relationship,
        parentalConsentConfirmed: sanitized.parentalConsentConfirmed,
        basic: sanitized.basic,
        education: sanitized.education,
        interests: sanitized.interests,
        skills: sanitized.skills,
        background: sanitized.background,
        completenessScore: sanitized.completenessScore,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid, 'profiles', profileId), {
        id: profileId,
        ownerId: uid,
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return profileId;
  } catch (error) {
    handleFirestoreError(error, existingId ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function deleteProfile(uid: string, profileId: string): Promise<void> {
  const assessmentsPath = `users/${uid}/profiles/${profileId}/assessments`;
  try {
    const assessSnap = await getDocs(
      query(collection(db, 'users', uid, 'profiles', profileId, 'assessments'), where('ownerId', '==', uid))
    );
    const batch = writeBatch(db);
    assessSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(doc(db, 'users', uid, 'profiles', profileId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, assessmentsPath);
  }
}

export function subscribeAssessmentsForProfile(
  uid: string,
  profileId: string,
  onData: (assessments: CareerAssessment[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/profiles/${profileId}/assessments`;
  const q = query(
    collection(db, 'users', uid, 'profiles', profileId, 'assessments'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => d.data() as CareerAssessment)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function saveCareerAssessment(
  uid: string,
  profile: PersonalProfile,
  generated: Omit<CareerAssessment, 'id' | 'ownerId' | 'profileId' | 'profileSnapshot' | 'createdAt'>
): Promise<string> {
  const assessmentId = generateSafeId('assess');
  const path = `users/${uid}/profiles/${profile.id}/assessments/${assessmentId}`;
  const sanitized = sanitizeCareerAssessmentForWrite(generated, profile);

  try {
    await setDoc(doc(db, 'users', uid, 'profiles', profile.id, 'assessments', assessmentId), {
      id: assessmentId,
      ownerId: uid,
      profileId: profile.id,
      ...sanitized,
      createdAt: serverTimestamp(),
    });
    return assessmentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCareerAssessment(
  uid: string,
  profileId: string,
  assessmentId: string
): Promise<void> {
  const path = `users/${uid}/profiles/${profileId}/assessments/${assessmentId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'profiles', profileId, 'assessments', assessmentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribePredictions(
  uid: string,
  onData: (predictions: FuturePrediction[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/predictions`;
  const q = query(
    collection(db, 'users', uid, 'predictions'),
    where('ownerId', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => d.data() as FuturePrediction)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function saveFuturePrediction(
  uid: string,
  generated: Omit<FuturePrediction, 'id' | 'ownerId' | 'createdAt'>
): Promise<string> {
  const predictionId = generateSafeId('pred');
  const path = `users/${uid}/predictions/${predictionId}`;
  const sanitized = sanitizeFuturePredictionForWrite(generated);

  try {
    if (auth.currentUser && auth.currentUser.uid === uid) {
      await ensureUserAccount(auth.currentUser);
    }
    await setDoc(doc(db, 'users', uid, 'predictions', predictionId), {
      id: predictionId,
      ownerId: uid,
      ...sanitized,
      createdAt: serverTimestamp(),
    });
    return predictionId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFuturePrediction(uid: string, predictionId: string): Promise<void> {
  const path = `users/${uid}/predictions/${predictionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'predictions', predictionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updatePreferredModel(uid: string, preferredModel: ModelId): Promise<void> {
  return updateUserSettings(uid, { preferredModel });
}
