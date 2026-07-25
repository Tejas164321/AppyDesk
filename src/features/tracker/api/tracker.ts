import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { ApplicationStatus } from "@/components/ui/status-rail";
import { ApplicationItem } from "@/features/applications/types";

export async function fetchUserApplications(uid: string): Promise<ApplicationItem[]> {
  try {
    const q = query(collection(db, "applications"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const items: ApplicationItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as ApplicationItem);
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching user applications:", error);
    return [];
  }
}

export async function updateApplicationStatusInDb(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<void> {
  try {
    const appRef = doc(db, "applications", applicationId);
    const nowIso = new Date().toISOString();

    await updateDoc(appRef, {
      status: newStatus,
      lastUpdatedAt: nowIso,
      history: arrayUnion({ status: newStatus, changedAt: nowIso }),
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
}
