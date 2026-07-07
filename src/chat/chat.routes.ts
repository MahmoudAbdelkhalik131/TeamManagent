import { Router } from "express";
import auth from "../auth/auth.middleware";
import chatValidation from "./chat.validation";
import chatServices from "./chat.services";
import { upload } from "../middlewares/cloudinary";

const chatRouter: Router = Router();

// --- GET: private one-to-one chat history ---
// Auth: any logged-in user can fetch their own conversation history
chatRouter.get(
  "/private/:receiverUsername",
  auth.verifyToken,
  chatValidation.getPrivateHistory,
  chatServices.getPrivateHistory
);

// --- GET: group (project) chat history ---
// Auth: only project members / admin can read
chatRouter.get(
  "/group/:projectId",
  auth.verifyToken,
  chatValidation.getProjectChat,
  chatServices.getGroupHistory
);

// --- GET: announcements for a project ---
// Auth: only project members / admin can read
chatRouter.get(
  "/announcements/:projectId",
  auth.verifyToken,
  chatValidation.getProjectChat,
  chatServices.getAnnouncements
);

// --- GET: total unread messages count ---
chatRouter.get(
  "/unread-count",
  auth.verifyToken,
  chatServices.getUnreadCount
);

// --- GET: per-room unread counts ---
chatRouter.get(
  "/unread-detailed",
  auth.verifyToken,
  chatServices.getDetailedUnread
);

// --- PATCH: mark a conversation as read ---
chatRouter.patch(
  "/read",
  auth.verifyToken,
  chatServices.markConversationAsRead
);

// --- POST: upload files for chat (e.g. announcements) ---
chatRouter.post(
  "/upload",
  auth.verifyToken,
  upload.array("files", 10), // Limit to 10 files
  chatServices.uploadFiles
);

// --- GET: download file proxy ---
chatRouter.get(
  "/download",
  chatServices.downloadFile
);

export default chatRouter;
