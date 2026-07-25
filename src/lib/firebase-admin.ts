import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: any = null;
let adminDb: Firestore | null = null;
let adminAuth: Auth | null = null;

try {
  if (!getApps().length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (
      serviceAccountJson &&
      serviceAccountJson.includes("service_account") &&
      !serviceAccountJson.includes("...")
    ) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  if (adminApp) {
    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);
  }
} catch (error) {
  console.warn("Firebase Admin SDK initialization skipped (no valid credentials):", error);
  adminDb = null;
  adminAuth = null;
}

export { adminDb, adminAuth };
