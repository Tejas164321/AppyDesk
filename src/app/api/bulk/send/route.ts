import { NextRequest, NextResponse } from "next/server";
import { checkAndUpdateRateLimit } from "@/lib/rate-limiter";
import { checkDuplicateApplication } from "@/lib/dedupe";
import { sendEmailViaGmail } from "@/lib/gmail";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contact, uid = "anonymous", dailyCap = 15 } = body;

    if (!contact || !contact.email || !contact.subject || !contact.body) {
      return NextResponse.json({ error: "Contact email, subject, and body are required" }, { status: 400 });
    }

    // 1. Check Rate Limiter
    const rateCheck = await checkAndUpdateRateLimit(uid, dailyCap);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.reason || "Daily send cap reached",
          rateLimited: true,
          sentToday: rateCheck.sentToday,
          dailyCap: rateCheck.dailyCap,
        },
        { status: 429 }
      );
    }

    // 2. Check Deduplication
    const companyName = contact.company || "Hiring Team";
    const dedupeCheck = await checkDuplicateApplication(uid, contact.email, companyName);
    if (dedupeCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: dedupeCheck.reason,
          isDuplicate: true,
        },
        { status: 409 }
      );
    }

    // 3. Fetch Cloudinary resume asset from Firestore user profile
    let resumeUrl: string | null = null;
    let resumeFilename: string | null = "Resume.pdf";

    if (uid && uid !== "anonymous" && adminDb) {
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.resumeFile?.cloudinaryUrl) {
            resumeUrl = userData.resumeFile.cloudinaryUrl;
            resumeFilename = userData.resumeFile.filename || "Resume.pdf";
          }
        }
      } catch (err) {
        console.warn("Could not fetch resume for bulk send:", err);
      }
    }

    // 4. Outbound Gmail send with retry
    let sendResult;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        sendResult = await sendEmailViaGmail({
          to: contact.email,
          subject: contact.subject,
          body: contact.body,
          resumeUrl,
          resumeFilename,
        });
        break;
      } catch (err) {
        if (attempts >= maxAttempts) throw err;
        await new Promise((r) => setTimeout(r, 1500)); // Backoff delay
      }
    }

    // 5. Log application to applications/{id}
    const applicationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const nowIso = new Date().toISOString();

    const applicationRecord = {
      id: applicationId,
      userId: uid,
      company: companyName,
      role: contact.role || "Bulk Outreach Candidate",
      contactEmail: contact.email,
      source: "bulk",
      jdSnippet: `Bulk batch contact: ${contact.name || contact.email}`,
      matchScore: 80,
      keyRequirements: ["Bulk Outreach Match"],
      subject: contact.subject,
      body: contact.body,
      status: "sent",
      channel: "bulk",
      createdAt: nowIso,
      sentAt: nowIso,
      lastUpdatedAt: nowIso,
      history: [
        { status: "drafted", changedAt: nowIso },
        { status: "sent", changedAt: nowIso },
      ],
    };

    if (adminDb) {
      try {
        await adminDb.collection("applications").doc(applicationId).set(applicationRecord);
      } catch (err) {
        console.warn("Firestore bulk application log error:", err);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult?.messageId,
      applicationId,
      sentToday: rateCheck.sentToday,
      remaining: rateCheck.remaining,
    });
  } catch (error: any) {
    console.error("Bulk send worker error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send bulk email" },
      { status: 500 }
    );
  }
}
