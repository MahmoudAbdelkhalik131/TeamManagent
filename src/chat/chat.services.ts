import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import MessageModel from "../message/message.schema";

class ChatServices {
  /**
   * GET /api/v1/chat/private/:receiverUsername
   *
   * Returns the last 100 messages exchanged between the logged-in user and
   * another specific user.
   *
   * The query uses $or so it captures both directions:
   *   - Messages the current user SENT to the receiver
   *   - Messages the current user RECEIVED from the receiver
   *
   * Sorting by createdAt: 1 (ascending) ensures the frontend receives messages
   * in chronological order — oldest first, newest last — which is the natural
   * order for a chat window.
   *
   * We cap at 100 with .limit(100) to avoid returning thousands of messages
   * in a single request. For older history, pagination can be added later.
   */
  getPrivateHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const myUsername = req.CurrentUser.username as string;
      const otherUsername = req.params.receiverUsername;

      const messages = await MessageModel.find({
        type: "private",
        $or: [
          // Direction 1: I sent, they received
          { sender: myUsername, receiver: otherUsername },
          // Direction 2: They sent, I received
          { sender: otherUsername, receiver: myUsername },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(100);

      res.status(200).json({ data: messages });
    }
  );

  /**
   * GET /api/v1/chat/group/:projectId
   *
   * Returns the last 100 group messages for a specific project.
   * Validation already confirmed the user belongs to this project.
   */
  getGroupHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { projectId } = req.params;

      const messages = await MessageModel.find({
        type: "group",
        projectId: projectId,
      })
        .sort({ createdAt: 1 })
        .limit(100);

      res.status(200).json({ data: messages });
    }
  );

  /**
   * GET /api/v1/chat/announcements/:projectId
   *
   * Returns ALL announcements for a project (no limit — announcements are
   * infrequent and important; users should be able to scroll back through all
   * of them).
   *
   * Sorted ascending so the most recent announcement appears last.
   */
  getAnnouncements = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { projectId } = req.params;

      const announcements = await MessageModel.find({
        type: "announcement",
        projectId: projectId,
      }).sort({ createdAt: 1 });

      res.status(200).json({ data: announcements });
    }
  );
}

const chatServices = new ChatServices();
export default chatServices;
