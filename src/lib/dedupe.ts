import "server-only";
import { adminDb } from "./firebase-admin";

export interface DedupeCheckResult {
  isDuplicate: boolean;
  existingAppId?: string;
  reason?: string;
}

export async function checkDuplicateApplication(
  uid: string,
  contactEmail: string,
  company: string,
  daysThreshold: number = 30
): Promise<DedupeCheckResult> {
  if (!adminDb || !uid || !contactEmail) {
    return { isDuplicate: false };
  }

  try {
    const q = adminDb
      .collection("applications")
      .where("userId", "==", uid)
      .where("contactEmail", "==", contactEmail.toLowerCase().trim());

    const snapshot = await q.get();
    if (snapshot.empty) {
      return { isDuplicate: false };
    }

    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    let duplicateDocId: string | undefined = undefined;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const appCompany = (data.company || "").toLowerCase().trim();
      const createdTime = new Date(data.createdAt).getTime();

      if (appCompany === company.toLowerCase().trim() && now - createdTime < thresholdMs) {
        duplicateDocId = docSnap.id;
      }
    });

    if (duplicateDocId) {
      return {
        isDuplicate: true,
        existingAppId: duplicateDocId,
        reason: `Application already sent to ${contactEmail} at ${company} within the last ${daysThreshold} days.`,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.warn("Dedupe check error fallback:", error);
    return { isDuplicate: false };
  }
}
