import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { adminDb } from "./firebase-admin";
import { UserProfile } from "@/features/profile/types";

// In-memory token store fallback for local development when Firebase Admin SDK is unconfigured
const devTokenStore = new Map<string, { uid: string; createdAt: string }>();

export function hashApiToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function generateRawApiToken(): string {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  return `adk_live_${randomBytes}`;
}

export function storeDevToken(hashedToken: string, uid: string) {
  devTokenStore.set(hashedToken, { uid, createdAt: new Date().toISOString() });
}

export function removeDevToken(uid: string) {
  for (const [hash, val] of devTokenStore.entries()) {
    if (val.uid === uid) {
      devTokenStore.delete(hash);
    }
  }
}

export interface AuthResult {
  authenticated: boolean;
  uid: string;
  userProfile: UserProfile;
  authType: "token" | "session" | "anonymous";
  error?: string;
}

export async function authenticateRequest(
  req: NextRequest,
  fallbackUid?: string
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization");
  
  // 1. Personal API Token Authentication via Bearer Header
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const rawToken = authHeader.substring(7).trim();
    if (!rawToken) {
      return {
        authenticated: false,
        uid: "",
        userProfile: getDefaultProfile(""),
        authType: "token",
        error: "Bearer token is empty",
      };
    }

    const hashedToken = hashApiToken(rawToken);

    // Try Firestore Admin DB first if available
    if (adminDb) {
      try {
        const querySnap = await adminDb
          .collection("users")
          .where("apiTokenHash", "==", hashedToken)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          const userDoc = querySnap.docs[0];
          const uid = userDoc.id;
          const userData = userDoc.data();
          const userProfile: UserProfile = { uid, ...userData } as UserProfile;

          userDoc.ref.update({ apiTokenLastUsedAt: new Date().toISOString() }).catch(() => {});

          return {
            authenticated: true,
            uid,
            userProfile,
            authType: "token",
          };
        }
      } catch (err) {
        console.warn("Firestore token query error, checking dev fallback:", err);
      }
    }

    // Fallback: Check in-memory dev token store
    const devRecord = devTokenStore.get(hashedToken);
    if (devRecord) {
      return {
        authenticated: true,
        uid: devRecord.uid,
        userProfile: getDefaultProfile(devRecord.uid),
        authType: "token",
      };
    }

    return {
      authenticated: false,
      uid: "",
      userProfile: getDefaultProfile(""),
      authType: "token",
      error: "Invalid or revoked API token",
    };
  }

  // 2. Fallback to Session / Body UID Authentication
  const targetUid = fallbackUid || "anonymous";
  let userProfile = getDefaultProfile(targetUid);

  if (targetUid && targetUid !== "anonymous" && adminDb) {
    try {
      const userDoc = await adminDb.collection("users").doc(targetUid).get();
      if (userDoc.exists) {
        userProfile = { uid: targetUid, ...userDoc.data() } as UserProfile;
      }
    } catch (err) {
      console.warn("Could not fetch user profile for session auth:", err);
    }
  }

  return {
    authenticated: true,
    uid: targetUid,
    userProfile,
    authType: targetUid === "anonymous" ? "anonymous" : "session",
  };
}

function getDefaultProfile(uid: string): UserProfile {
  return {
    uid: uid || "anonymous",
    name: "Tejas Patil",
    email: "tejaspatil1643@gmail.com",
    phone: "+91 9960469732",
    location: "Pune, India",
    links: { linkedin: "https://linkedin.com/in/tejaspatil", github: "https://github.com/Tejas164321", portfolio: "", resumeLink: "" },
    summary: "Full-Stack & Mobile Developer (React, Next.js, Node.js, AI/ML, Python).",
    settings: { dailySendCap: 15, warmupStartDate: new Date().toISOString(), timezone: "UTC" },
  };
}
