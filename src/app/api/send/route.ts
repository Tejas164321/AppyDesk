import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaGmail } from "@/lib/gmail";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      company,
      role,
      contactEmail,
      subject,
      body,
      matchScore = 0,
      keyRequirements = [],
      jdSnippet = "",
      source = "paste",
      uid = "anonymous",
    } = payload;

    if (!contactEmail || !subject || !body) {
      return NextResponse.json(
        { error: "Recipient email, subject, and body are required" },
        { status: 400 }
      );
    }

    // 1. Fetch user's Cloudinary resume asset from Firestore
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
        console.warn("Could not fetch user resume from Firestore admin:", err);
      }
    }

    // 2. Outbound email send via Gmail API
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
      userId: uid,
      company,
      role,
      contactEmail,
      source,
      jdSnippet,
      matchScore,
      keyRequirements,
      subject,
      body,
      status: "sent",
      channel: "single",
      createdAt: nowIso,
      sentAt: nowIso,
      lastUpdatedAt: nowIso,
      history: [
        { status: "drafted", changedAt: nowIso },
        { status: "reviewed", changedAt: nowIso },
        { status: "sent", changedAt: nowIso },
      ],
    };

    // 3. Persist log to applications/{id} in Firestore
    if (adminDb) {
      try {
        await adminDb.collection("applications").doc(applicationId).set(applicationRecord);
      } catch (err) {
        console.warn("Could not write application log to Firestore:", err);
      }
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      application: applicationRecord,
    });
  } catch (error: any) {
    console.error("Outbound send API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send application email" },
      { status: 500 }
    );
  }
}
