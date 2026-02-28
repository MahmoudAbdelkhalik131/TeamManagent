import { Router } from "express";
import auth from "../auth/auth.middleware";
import chatValidation from "./chat.validation";
import chatServices from "./chat.services";

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

export default chatRouter;
