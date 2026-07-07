import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import MessageModel from "../message/message.schema";
import projectSchema from "../Project/project.schema";
import userSchema from "../Users/user.schema";
import { uploadToCloudinary } from "../middlewares/cloudinary";
import https from "https";

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

  /**
   * POST /api/v1/chat/upload
   * Uploads files for chat messages (e.g. announcements)
   */
  uploadFiles = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        res.status(400).json({ message: "No files uploaded" });
        return;
      }

      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
      
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const formattedFiles = uploadedFiles.map((file) => ({
        url: file.secure_url,
        public_id: file.public_id,
      }));

      res.status(200).json({ data: formattedFiles });
    }
  );

  /**
   * GET /api/v1/chat/download
   * Proxies file downloads from Cloudinary to force attachment headers and correct file names.
   */
  downloadFile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { url, filename } = req.query;
      if (!url || typeof url !== "string") {
        res.status(400).json({ message: "URL is required" });
        return;
      }

      const fileUrl = decodeURIComponent(url);
      const targetFilename = (typeof filename === "string" && filename)
        ? filename
        : fileUrl.substring(fileUrl.lastIndexOf("/") + 1) || "download";

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(targetFilename)}"`
      );

      https.get(fileUrl, (stream) => {
        if (stream.headers["content-type"]) {
          res.setHeader("Content-Type", stream.headers["content-type"]);
        } else {
          res.setHeader("Content-Type", "application/octet-stream");
        }
        stream.pipe(res);
      }).on("error", (err) => {
        next(err);
      });
    }
  );
}

const chatServices = new ChatServices();
export default chatServices;
