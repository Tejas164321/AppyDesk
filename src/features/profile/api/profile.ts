import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { UserProfile } from "../types";

export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

export async function saveUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(
      userDocRef,
      {
        ...profileData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}
