import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const uid = formData.get("uid") as string | null;

    if (!file || !uid) {
      return NextResponse.json({ error: "File and user ID are required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");

    const result = await uploadToCloudinary(
      buffer,
      `resumes/${uid}`,
      `resume_${Date.now()}_${sanitizedFilename}`,
      "auto"
    );

    return NextResponse.json({
      cloudinaryUrl: result.url,
      publicId: result.publicId,
      filename: file.name,
      mimeType: file.type || "application/pdf",
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cloudinary resume upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload resume file" },
      { status: 500 }
    );
  }
}
