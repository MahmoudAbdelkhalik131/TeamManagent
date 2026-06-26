// middleware/uploadMiddleware.js
// =============================================
// REUSABLE MIDDLEWARE
// Import this in any route that needs uploads.
// Supports single file, multiple files, or
// specific named fields.
// =============================================

import { NextFunction,Response } from "express";
import {upload} from "./cloudinary";

// ── Single file upload (field name: "file") ────────────────────────────────
// Usage in route: router.post('/avatar', uploadSingle, controller)
// Frontend input: <input type="file" name="file" />
export const uploadSingle = upload.single("file");

// ── Single image upload (field name: "image") ─────────────────────────────
// Usage in route: router.put('/profile/avatar', uploadSingleImage, controller)
// Frontend input: <input type="file" name="image" accept="image/*" />
export const uploadSingleImage = upload.single("image");

// ── Multiple files (up to 5) ──────────────────────────────────────────────
// Usage in route: router.post('/gallery', uploadMultiple, controller)
// Frontend input: <input type="file" name="files" multiple />
export const uploadMultiple = upload.array("files", 5);

// ── Multiple named fields (e.g. profile form) ──────────────────────────────
// Usage in route: router.post('/profile', uploadFields, controller)
// req.files.avatar[0] and req.files.resume[0] will be available

// ── Error handler for Multer-specific errors ───────────────────────────────
// Add this AFTER your route handler as a middleware
export const handleUploadError = (err:any, req:Request, res:Response, next:NextFunction) => {
  if (err.name === "MulterError") {
    // Multer-specific errors (file too large, too many files, etc.)
    const messages: { [key: string]: string } = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size is 10MB.",
      LIMIT_FILE_COUNT: "Too many files uploaded at once.",
      LIMIT_UNEXPECTED_FILE: "Unexpected field name in the form.",
    };
    return res.status(400).json({
      success: false,
      error: messages[err.code] || err.message,
    });
  }

  if (err) {
    // Other errors (e.g. file type not allowed from our fileFilter)
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  next();
};
