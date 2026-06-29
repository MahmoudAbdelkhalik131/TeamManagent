import { Server, Socket } from "socket.io";
import Token from "./Tokens";
import dotenv from "dotenv";
import projectSchema from "../Project/project.schema";
import MessageModel from "../message/message.schema";
import Project from "../Project/project.interface";
import userSchema from "../Users/user.schema";
dotenv.config();

// ==========================================================
// INTERFACES
// ==========================================================

/**
 * The decoded payload we extract from the JWT token.
 * Matches the shape that auth.middleware.ts puts into req.CurrentUser.
 */
interface UserPayload {
  _id: string;
  username: string;
  role: "admin" | "member";
}

/**
 * We extend the Socket interface so TypeScript knows our custom
 * `user` property exists on every authenticated socket.
 */
interface CustomSocket extends Socket {
  user?: UserPayload;
}

// Data shapes expected from the client for each event
interface PrivateMessageData {
  receiverUsername: string; // the other user's username
  content: string;
}

interface GroupMessageData {
  projectId: string;
  content: string;
}

interface AnnouncementData {
  projectId: string;
  title: string;
  content: string;
}

// ==========================================================
// HELPER: emit a structured error back to the sender only
// ==========================================================

/**
 * Instead of crashing or silently ignoring bad input,
 * we always send a consistent error event back to the socket.
 * The client can listen on "error_event" to show a toast/alert.
 */
function emitError(socket: CustomSocket, message: string) {
  socket.emit("error_event", { message });
}

// ==========================================================
// HELPER: validate message content
// ==========================================================

/**
 * Centralized content check so every event type uses the same rules.
 * Returns true if valid, false if not (and emits the error for you).
 */
function isValidContent(
  socket: CustomSocket,
  content: unknown,
  maxLength = 2000
): content is string {
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    emitError(socket, "Message content must be a non-empty string");
    return false;
  }
  if (content.trim().length > maxLength) {
    emitError(
      socket,
      `Message content cannot exceed ${maxLength} characters`
    );
    return false;
  }
  return true;
}

// ==========================================================
// EXPORTED INITIALIZER — called from main.ts after io is created
// ==========================================================

/**
 * Why a function instead of a side-effect module?
 *
 * The old pattern imported `io` directly from main.ts, which creates a
 * circular dependency: main.ts → chat.ts → main.ts.
 * Node.js handles circular imports by returning a partially-initialised
 * module — meaning `io` could be `undefined` when chat.ts first reads it.
 *
 * By exporting `initChat(io)` and calling it from main.ts AFTER io is
 * fully created, we guarantee io is always the real Server instance.
 */
export function initChat(io: Server) {

  // ==========================================================
  // 1. SOCKET.IO AUTH MIDDLEWARE
  // ==========================================================

  /**
   * This runs ONCE per connection, before the "connection" event fires.
   * It reads the JWT from socket.handshake.auth.token, verifies it,
   * and stores the decoded user on the socket object.
   *
   * Why here instead of per-event?
   *   If we check auth inside every event handler, we repeat the same
   *   code everywhere and a missing check is a security hole.
   *   Doing it once as a middleware means unauthenticated sockets are
   *   rejected at the door; every event handler can safely use socket.user!
   *
   * Note on token shape:
   *   Token.createToken() wraps the payload: { user: payload }
   *   so decoded.user is the actual user object.
   */
  io.use(async(socket: CustomSocket, next) => {
    try {
      // Standard Socket.IO way: prefer the 'auth' payload over headers, as browser WebSockets don't support custom headers well
      const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization?.split(" ")[1] as string | undefined);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded: any = Token.verifyToken(token);
      if (!decoded || !decoded.user) {
        return next(new Error("Authentication error: Invalid token"));
      }      
      // Store on socket so every event handler can access it without
      // re-reading and re-verifying the JWT on every event
      socket.user = {
        _id: decoded.user._id,
        username: decoded.user.username,
        role: decoded.user.role,
      };

      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ==========================================================
  // 2. CONNECTION HANDLER
  // ==========================================================

  io.on("connection", (socket: CustomSocket) => {
    // Since our middleware ran, user is guaranteed to exist here
    const user = socket.user!;

    /**
     * PERSONAL ROOM
     * Each user automatically joins a room named after their own username.
     * When someone sends a private message to user "alice", we emit to
     * room "alice" — so any of her connected devices/tabs receive it.
     */
    
    socket.join(user.username);
    console.log(`🚀 Socket connected: ${user.username} [role: ${user.role}]`);

    // ----------------------------------------------------------
    // EVENT A: join_project
    // ----------------------------------------------------------

    /**
     * The client calls this immediately after connecting to receive
     * real-time messages for a specific project.
     *
     * We use Socket.io rooms (named by projectId) so that when we want
     * to broadcast a group message, we call io.to(projectId) and only
     * the users in that room get it.
     *
     * No DB write here — joining a room is just an in-memory subscription.
     */
    socket.on("join_project", (projectId: string) => {
      if (!projectId || typeof projectId !== "string") {
        console.warn(`join_project failed: invalid projectId from ${projectId}`);
        return emitError(socket, "Invalid projectId for join_project");
      }
      socket.join(projectId);
      console.log(`📁 ${user.username} joined project room: ${projectId}`);
    });

    // ----------------------------------------------------------
    // EVENT B: send_private_message  (one-to-one)
    // ----------------------------------------------------------

    /**
     * Flow:
     *  1. Validate content (length, non-empty)
     *  2. Validate receiver is not self
     *  3. Save the message to the database FIRST
     *  4. Emit to the receiver's personal room
     *  5. Echo the saved document back to the sender as acknowledgement
     *
     * Why save first then emit?
     *   If we emit first and the DB save fails, the receiver saw a message
     *   that doesn't exist in history — confusion on reload. Saving first
     *   guarantees consistency: if save fails, nothing is emitted.
     *
     * Why emit to receiver's room (not their socket id)?
     *   Socket IDs change every connection. If the user has two tabs open,
     *   emitting to the room (join(username) above) delivers to all of them.
     */
    socket.on("send_private_message", async (data: PrivateMessageData) => {
      try {
        console.log(data)
        const { receiverUsername, content } = data;

        // --- Validation ---
        if (!isValidContent(socket, content)) return;

        if (!receiverUsername || typeof receiverUsername !== "string") {
          return emitError(socket, "Receiver username is required");
        }
        if (receiverUsername.trim() === user.username) {
          return emitError(socket, "You cannot send a message to yourself");
        }

        // --- Team Check ---
        const sender = await userSchema.findOne({ username: user.username });
        if (!sender || !sender.teamMates || !sender.teamMates.includes(receiverUsername.trim())) {
          return emitError(socket, "You can only send messages to your team members");
        }
        
        // --- Persist to DB ---
        const savedMessage = await MessageModel.create({
          type: "private",
          sender: user.username,
          receiver: receiverUsername.trim(),
          content: content.trim(),
          readBy: [user.username],
        });

        // --- Payload emitted to clients ---
        const payload = {
          _id: savedMessage._id,
          type: "private",
          sender: user.username,
          receiver: receiverUsername.trim(),
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
        };

        // Deliver to receiver (room = their username)
        io.to(receiverUsername.trim()).emit("receive_private_message", payload);

        // Also reflect back to the sender (important for multi-tab UX)
        socket.emit("receive_private_message", payload);
      } catch (err: any) {
        console.error("send_private_message error:", err.message);
        emitError(socket, "Failed to send message. Please try again.");
      }
    });

    // ----------------------------------------------------------
    // EVENT C: send_group_message  (project public chat)
    // ----------------------------------------------------------

    /**
     * Flow:
     *  1. Validate content
     *  2. Check the projectId is provided
     *  3. Check the sender is actually a member or admin of that project
     *     (prevents a user who was later removed from a project from
     *      still posting messages via a stale socket connection)
     *  4. Save to DB
     *  5. Broadcast to all users currently in projectId room
     *
     * Why the DB membership check inside the socket event?
     *   Socket.io room membership is NOT the same as project membership.
     *   A malicious client could call join_project with any projectId and
     *   then post. The DB check ensures the user legitimately belongs.
     */
    socket.on("send_group_message", async (data: GroupMessageData) => {
      try {
        const { projectId, content } = data;

        // --- Validation ---
        if (!isValidContent(socket, content)) return;

        if (!projectId || typeof projectId !== "string") {
          return emitError(socket, "projectId is required");
        }

        // --- Authorization: confirm membership ---
        const project = await projectSchema.findById(projectId);
        if (!project) {
          return emitError(socket, "Project not found");
        }
        const isAdmin = project.usernameAdmin === user.username;
        const isMember = project.usernameMember.includes(user.username);
        if (!isAdmin && !isMember) {
          return emitError(socket, "You are not a member of this project");
        }

        // --- Persist to DB ---
        const savedMessage = await MessageModel.create({
          type: "group",
          sender: user.username,
          projectId: projectId,
          role:user.role, // Store sender's role at the time of message for historical accuracy
          content: content.trim(),
          readBy: [user.username],
        });

        // --- Broadcast to all project room members ---
        io.to(projectId).emit("receive_group_message", {
          _id: savedMessage._id,
          type: "group",
          sender: user.username,
          role: user.role,
          projectId: projectId,
          content: savedMessage.content,
          createdAt: savedMessage.createdAt,
        });
      } catch (err: any) {
        console.error("send_group_message error:", err.message);
        emitError(socket, "Failed to send group message. Please try again.");
      }
    });

    // ----------------------------------------------------------
    // EVENT D: send_announcement  (admin-only)
    // ----------------------------------------------------------

    /**
     * Flow:
     *  1. Validate title (required, max 200 chars) and content
     *  2. Fetch the project from DB and check that the sender IS
     *     the usernameAdmin of THAT specific project — NOT just any admin.
     *     A user with role="admin" who does NOT own this project cannot post.
     *  3. Save to DB
     *  4. Broadcast to entire project room
     *
     * Why check project.usernameAdmin and not user.role === "admin"?
     *   The role="admin" flag is a system-level role, but a project's admin
     *   is stored in Project.usernameAdmin. An "admin" user could belong to
     *   multiple projects — they should only announce in their own projects.
     */
    socket.on("send_announcement", async (data: AnnouncementData) => {
      try {
        const { projectId, title, content } = data;

        // --- Validate content and title ---
        if (!isValidContent(socket, content)) return;

        if (!title || typeof title !== "string" || title.trim().length === 0) {
          return emitError(socket, "Announcement title is required");
        }
        if (title.trim().length > 200) {
          return emitError(
            socket,
            "Announcement title cannot exceed 200 characters"
          );
        }

        if (!projectId || typeof projectId !== "string") {
          return emitError(socket, "projectId is required");
        }

        // --- Authorization: must be the admin of THIS project ---
        const project = await projectSchema.findById(projectId);
        if (!project) {
          return emitError(socket, "Project not found");
        }
        if (project.usernameAdmin !== user.username) {
          return emitError(
            socket,
            "Only the admin of this project can post announcements"
          );
        }

        // --- Persist to DB ---
        const savedAnnouncement = await MessageModel.create({
          type: "announcement",
          sender: user.username,
          projectId: projectId,
          title: title.trim(),
          content: content.trim(),
          readBy: [user.username],
        });

        // --- Broadcast to everyone in the project room ---
        io.to(projectId).emit("receive_announcement", {
          _id: savedAnnouncement._id,
          type: "announcement",
          sender: user.username,
          projectId: projectId,
          title: savedAnnouncement.title,
          content: savedAnnouncement.content,
          createdAt: savedAnnouncement.createdAt,
        });
      } catch (err: any) {
        console.error("send_announcement error:", err.message);
        emitError(socket, "Failed to post announcement. Please try again.");
      }
    });

    // ----------------------------------------------------------
    // EVENT E: disconnect
    // ----------------------------------------------------------
    socket.on("disconnect", (reason) => {
      console.log(
        `👋 Socket disconnected: ${user.username} | reason: ${reason}`
      );
    });
  });
}
