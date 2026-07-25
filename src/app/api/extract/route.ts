import { NextRequest, NextResponse } from "next/server";
import { extractAndDraftWithClaude } from "@/features/extraction/lib/extract-engine";
import { adminDb } from "@/lib/firebase-admin";
import { UserProfile } from "@/features/profile/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, imageUrl, uid, llmConfig } = body;

    if (!text && !imageUrl) {
      return NextResponse.json({ error: "Job description text or screenshot image is required" }, { status: 400 });
    }

    let userProfile: UserProfile = {
      uid: uid || "default",
      name: "Applicant",
      email: "applicant@example.com",
      phone: "",
      location: "Remote",
      links: { linkedin: "", github: "", portfolio: "", resumeLink: "" },
      summary: "Experienced Full-Stack Web Developer",
      settings: { dailySendCap: 15, warmupStartDate: new Date().toISOString(), timezone: "UTC" },
    };

    if (uid && adminDb) {
      try {
        const userDoc = await adminDb.collection("users").doc(uid).get();
        if (userDoc.exists) {
          userProfile = { uid, ...userDoc.data() } as UserProfile;
        }
      } catch (err) {
        console.warn("Firestore admin lookup fallback:", err);
      }
    }

    const effectiveLlmConfig = llmConfig || userProfile.llmConfig;
    const extraction = await extractAndDraftWithClaude(text, imageUrl, userProfile, effectiveLlmConfig);
    return NextResponse.json(extraction);
  } catch (error: any) {
    console.error("Extraction route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to extract job posting details" },
      { status: 500 }
    );
  }
}
