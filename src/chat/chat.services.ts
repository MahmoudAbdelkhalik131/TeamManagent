import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import MessageModel from "../message/message.schema";
import projectSchema from "../Project/project.schema";
import userSchema from "../Users/user.schema";

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

      // Check if the other user is in the team
      const me = await userSchema.findOne({ username: myUsername });
      if (!me || !me.teamMates || !me.teamMates.includes(otherUsername)) {
        res.status(403).json({ message: "You can only chat with your team members" });
        return;
      }

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

  /**
   * GET /api/v1/chat/unread-count
   */
  getUnreadCount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const myUsername = req.CurrentUser.username as string;

      // 1. Private messages unread
      const privateUnread = await MessageModel.countDocuments({
        type: "private",
        receiver: myUsername,
        readBy: { $ne: myUsername },
      });

      // 2. Group messages unread
      // First find projects user is in
      const myProjects = await projectSchema.find({
        $or: [
          { usernameAdmin: myUsername },
          { usernameMember: myUsername },
        ]
      }).select("_id");
      const projectIds = myProjects.map((p: any) => p._id);

      const groupUnread = await MessageModel.countDocuments({
        type: { $in: ["group", "announcement"] },
        projectId: { $in: projectIds },
        readBy: { $ne: myUsername },
      });

      res.status(200).json({ 
        data: { 
          total: privateUnread + groupUnread,
          private: privateUnread,
          group: groupUnread
        } 
      });
    }
  );

  /**
   * GET /api/v1/chat/unread-detailed
   * Returns per-room unread counts so the frontend can show badges.
   */
  getDetailedUnread = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const myUsername = req.CurrentUser.username as string;

      // 1. Unread DMs grouped by sender
      const dmUnread = await MessageModel.aggregate([
        {
          $match: {
            type: "private",
            receiver: myUsername,
            readBy: { $ne: myUsername },
          },
        },
        { $group: { _id: "$sender", count: { $sum: 1 } } },
      ]);

      // 2. Unread group messages grouped by projectId + type
      const myProjects = await projectSchema.find({
        $or: [
          { usernameAdmin: myUsername },
          { usernameMember: myUsername },
        ]
      }).select("_id");
      const projectIds = myProjects.map((p: any) => p._id);

      const groupUnread = await MessageModel.aggregate([
        {
          $match: {
            type: "group",
            projectId: { $in: projectIds },
            readBy: { $ne: myUsername },
          },
        },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ]);

      const announcementUnread = await MessageModel.aggregate([
        {
          $match: {
            type: "announcement",
            projectId: { $in: projectIds },
            readBy: { $ne: myUsername },
          },
        },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
      ]);

      // Build a flat map: { "roomType:roomId": count }
      const unreadMap: Record<string, number> = {};
      dmUnread.forEach((d: any) => { unreadMap[`dm:${d._id}`] = d.count; });
      groupUnread.forEach((g: any) => { unreadMap[`group:${g._id}`] = g.count; });
      announcementUnread.forEach((a: any) => { unreadMap[`announcement:${a._id}`] = a.count; });

      res.status(200).json({ data: unreadMap });
    }
  );

  /**
   * PATCH /api/v1/chat/read
   * body: { type: 'dm' | 'group', id: 'username' | 'projectId' }
   */
  markConversationAsRead = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const myUsername = req.CurrentUser.username as string;
      const { type, id } = req.body;

      let filter: any = {};
      if (type === "dm") {
        filter = {
          type: "private",
          $or: [
            { sender: myUsername, receiver: id },
            { sender: id, receiver: myUsername },
          ],
        };
      } else {
        filter = {
          type: { $in: ["group", "announcement"] },
          projectId: id,
        };
      }

      await MessageModel.updateMany(
        { ...filter, readBy: { $ne: myUsername } },
        { $addToSet: { readBy: myUsername } }
      );

      res.status(200).json({ status: "success" });
    }
  );
}

const chatServices = new ChatServices();
export default chatServices;
