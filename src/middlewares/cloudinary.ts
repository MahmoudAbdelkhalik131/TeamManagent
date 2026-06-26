// config/cloudinary.ts
// =============================================
// THE CENTER OF EVERYTHING
// Uses memoryStorage + upload_stream instead of
// CloudinaryStorage — fully compatible with
// Cloudinary v2. No adapter needed.
// =============================================

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Request } from "express";
import streamifier from "streamifier";

// ── 1. Connect to your Cloudinary account ──────────────────────────────────
cloudinary.config({
  cloud_url: process.env.CLOUDINARY_URL,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── 2. File filter — only allow specific file types ────────────────────────
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // ✅ accept
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`)); // ❌ reject
  }
};

// ── 3. Use memoryStorage — file lands in req.file.buffer (RAM) ─────────────
//    We do NOT send to Cloudinary here. That happens in uploadToCloudinary().
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// ── 4. Determine the right Cloudinary folder and resource_type based on MIME ─
const getFolder = (mimetype: string): string => {
  if (mimetype.startsWith("image/")) return "uploads/images";
  if (mimetype.startsWith("video/")) return "uploads/videos";
  if (mimetype === "application/pdf") return "uploads/documents";
  return "uploads/misc";
};

const getResourceType = (
  mimetype: string
): "image" | "video" | "raw" => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "raw"; // PDFs, DOCX, etc.
};

// ── 5. The core function: stream the buffer up to Cloudinary ───────────────
//    Returns a promise that resolves with the Cloudinary upload result.
//    Call this inside your controller after Multer has run.
export interface CloudinaryUploadResult {
  public_id: string;   // use this to delete the file later
  secure_url: string;  // the public HTTPS URL
  resource_type: string;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const folder = getFolder(file.mimetype);
    const resource_type = getResourceType(file.mimetype);

    // upload_stream reads from a Node.js readable stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type, // ✅ dynamic: "image" | "video" | "raw"
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve(result as CloudinaryUploadResult);
      }
    );

    // streamifier converts the Buffer (from memoryStorage) into a readable stream
    // that upload_stream can consume
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// ── 6. Export cloudinary so controllers can call .uploader.destroy() ───────
export { cloudinary };
