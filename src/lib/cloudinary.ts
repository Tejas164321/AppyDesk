import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string,
  filename: string,
  resourceType: "raw" | "auto" | "image" = "auto"
) {
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!secret || secret.includes("*") || secret.includes("your-actual-api-secret")) {
    throw new Error(
      "Cloudinary API Secret is missing or invalid in .env.local. Please add your real CLOUDINARY_API_SECRET from console.cloudinary.com."
    );
  }

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `applydesk/${folder}`,
        public_id: filename,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export { cloudinary };
