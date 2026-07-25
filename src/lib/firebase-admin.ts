import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";

let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let initialized = false;

function initAdmin() {
  if (initialized) return;
  initialized = true;

  try {
    const { getApps, initializeApp, cert } = require("firebase-admin/app");
    const { getFirestore } = require("firebase-admin/firestore");
    const { getAuth } = require("firebase-admin/auth");

    let adminApp;
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
      dbInstance = getFirestore(adminApp);
      authInstance = getAuth(adminApp);
    }
  } catch (error) {
    console.warn("Firebase Admin SDK lazy init skipped (no valid service account):", error);
    dbInstance = null;
    authInstance = null;
  }
}

export const adminDb = new Proxy({} as Firestore, {
  get(target, prop) {
    initAdmin();
    if (!dbInstance) return undefined;
    const value = (dbInstance as any)[prop];
    return typeof value === "function" ? value.bind(dbInstance) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(target, prop) {
    initAdmin();
    if (!authInstance) return undefined;
    const value = (authInstance as any)[prop];
    return typeof value === "function" ? value.bind(authInstance) : value;
  },
});
