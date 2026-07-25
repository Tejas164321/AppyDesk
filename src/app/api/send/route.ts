import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaGmail } from "@/lib/gmail";
import { adminDb } from "@/lib/firebase-admin";
import { authenticateRequest } from "@/lib/api-auth";
import { checkAndUpdateRateLimit } from "@/lib/rate-limiter";
import { checkDuplicateApplication } from "@/lib/dedupe";
import { handleCorsOptions, withCors } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const {
      company = "Company",
      role = "Position",
      contactEmail,
      subject,
      body,
      matchScore = 0,
      keyRequirements = [],
      jdSnippet = "",
      source = "single",
      uid,
    } = payload;

    if (!contactEmail || !subject || !body) {
      return withCors(
        NextResponse.json(
          { error: "Recipient email, subject, and body are required" },
          { status: 400 }
        ),
        req
      );
    }

    // 1. Authenticate Request via Personal Token or Session fallback
    const authResult = await authenticateRequest(req, uid);
    if (!authResult.authenticated) {
      return withCors(
        NextResponse.json({ error: authResult.error || "Unauthorized access" }, { status: 401 }),
        req
      );
    }

    const effectiveUid = authResult.uid;
    const userProfile = authResult.userProfile;
    const dailyCap = userProfile.settings?.dailySendCap || 15;

    // 2. Enforce Rate Limiting
    const rateCheck = await checkAndUpdateRateLimit(effectiveUid, dailyCap);
    if (!rateCheck.allowed) {
      return withCors(
        NextResponse.json(
          {
            error: rateCheck.reason || "Daily email send cap reached",
            rateLimited: true,
            sentToday: rateCheck.sentToday,
            dailyCap: rateCheck.dailyCap,
          },
          { status: 429 }
        ),
        req
      );
    }

    // 3. Enforce Deduplication Check
    const dedupeCheck = await checkDuplicateApplication(effectiveUid, contactEmail, company);
    if (dedupeCheck.isDuplicate) {
      return withCors(
        NextResponse.json(
          {
            error: dedupeCheck.reason,
            isDuplicate: true,
          },
          { status: 409 }
        ),
        req
      );
    }

    // 4. Resolve Resume Asset from User Profile
    let resumeUrl: string | null = userProfile.resumeFile?.cloudinaryUrl || null;
    let resumeFilename: string | null = userProfile.resumeFile?.filename || "Resume.pdf";

    // 5. Send Email via Gmail API
    const sendResult = await sendEmailViaGmail({
      to: contactEmail,
      subject,
      body,
      resumeUrl,
      resumeFilename,
    });

    const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const applicationRecord = {
      id: applicationId,
      userId: effectiveUid,
      company,
      role,
      contactEmail,
      source: source || "single",
      jdSnippet,
      matchScore,
      keyRequirements,
      subject,
      body,
      status: "sent",
      channel: source === "extension" ? "extension" : "single",
      createdAt: nowIso,
      sentAt: nowIso,
      lastUpdatedAt: nowIso,
      history: [
        { status: "drafted", changedAt: nowIso },
        { status: "reviewed", changedAt: nowIso },
        { status: "sent", changedAt: nowIso },
      ],
    };

    // 6. Log Application to Firestore applications/{id}
    if (adminDb) {
      try {
        await adminDb.collection("applications").doc(applicationId).set(applicationRecord);
      } catch (err) {
        console.warn("Could not write application record to Firestore:", err);
      }
    }

    return withCors(
      NextResponse.json({
        success: true,
        messageId: sendResult.messageId,
        application: applicationRecord,
      }),
      req
    );
  } catch (error: any) {
    console.error("Outbound send API error:", error);
    return withCors(
      NextResponse.json(
        { error: error?.message || "Failed to send application email" },
        { status: 500 }
      ),
      req
    );
  }
}
