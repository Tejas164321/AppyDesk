import { NextRequest, NextResponse } from "next/server";
import { generateRawApiToken, hashApiToken, storeDevToken, removeDevToken } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { handleCorsOptions, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid } = body;

    if (!uid) {
      return withCors(
        NextResponse.json({ error: "User ID (uid) is required" }, { status: 400 }),
        req
      );
    }

    const rawToken = generateRawApiToken();
    const tokenHash = hashApiToken(rawToken);
    const createdAt = new Date().toISOString();

    // Store in dev fallback store
    storeDevToken(tokenHash, uid);

    // Store in Firestore if available
    const adminDb = getAdminDb();
    if (adminDb) {
      try {
        await adminDb.collection("users").doc(uid).set(
          {
            apiTokenHash: tokenHash,
            apiTokenCreatedAt: createdAt,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Could not persist token hash to Firestore admin, using dev fallback:", err);
      }
    }

    return withCors(
      NextResponse.json({
        success: true,
        token: rawToken,
        createdAt,
      }),
      req
    );
  } catch (error: any) {
    console.error("Token generation error:", error);
    return withCors(
      NextResponse.json(
        { error: error?.message || "Failed to generate API token" },
        { status: 500 }
      ),
      req
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid } = body;

    if (!uid) {
      return withCors(
        NextResponse.json({ error: "User ID (uid) is required" }, { status: 400 }),
        req
      );
    }

    removeDevToken(uid);

    const adminDb = getAdminDb();
    if (adminDb) {
      try {
        await adminDb.collection("users").doc(uid).update({
          apiTokenHash: null,
          apiTokenCreatedAt: null,
          apiTokenLastUsedAt: null,
        });
      } catch (err) {
        console.warn("Could not revoke token in Firestore admin:", err);
      }
    }

    return withCors(
      NextResponse.json({
        success: true,
        message: "API token successfully revoked",
      }),
      req
    );
  } catch (error: any) {
    console.error("Token revocation error:", error);
    return withCors(
      NextResponse.json(
        { error: error?.message || "Failed to revoke API token" },
        { status: 500 }
      ),
      req
    );
  }
}
