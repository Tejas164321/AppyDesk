import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let adminApp;

if (!getApps().length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson && serviceAccountJson !== '{"type":"service_account","project_id":"..."}') {
      const serviceAccount = JSON.parse(serviceAccountJson);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      adminApp = initializeApp();
    }
  } catch (error) {
    console.warn("Firebase Admin SDK init fallback (development mode):", error);
  }
} else {
  adminApp = getApps()[0];
}

export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminAuth = adminApp ? getAuth(adminApp) : null;
