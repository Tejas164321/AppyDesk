import { NextRequest, NextResponse } from "next/server";
import { extractAndDraftWithClaude } from "@/features/extraction/lib/extract-engine";
import { authenticateRequest } from "@/lib/api-auth";
import { handleCorsOptions, withCors } from "@/lib/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text = "", images, imageUrl, uid, llmConfig } = body;

    const imageList: string[] = Array.isArray(images)
      ? images
      : typeof images === "string" && images
      ? [images]
      : imageUrl
      ? [imageUrl]
      : [];

    if (!text && imageList.length === 0) {
      return withCors(
        NextResponse.json(
          { error: "Job description text or at least one screenshot image is required" },
          { status: 400 }
        ),
        req
      );
    }

    // Authenticate via Bearer Token or Session UID fallback
    const authResult = await authenticateRequest(req, uid);
    if (!authResult.authenticated) {
      return withCors(
        NextResponse.json({ error: authResult.error || "Unauthorized access" }, { status: 401 }),
        req
      );
    }

    const effectiveLlmConfig = llmConfig || authResult.userProfile.llmConfig;
    const extraction = await extractAndDraftWithClaude(
      text,
      imageList,
      authResult.userProfile,
      effectiveLlmConfig
    );

    return withCors(NextResponse.json(extraction), req);
  } catch (error: any) {
    console.error("Extraction route error:", error);
    return withCors(
      NextResponse.json(
        { error: error?.message || "Failed to extract job posting details" },
        { status: 500 }
      ),
      req
    );
  }
}
