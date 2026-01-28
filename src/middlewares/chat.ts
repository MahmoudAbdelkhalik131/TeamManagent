import io from "socket.io"
import { Server as IOServer, Socket } from "socket.io";
import http from "http";
import Tokens from "../middlewares/Tokens"; // adjust if exported name differs
import projectSchema from "../Project/project.schema";
import messageSchema from "../message/message.schema"; // created below

interface BroadcastPayload {
  projectId: string;
  content: string;
  meta?: Record<string, any>;
}
export function initSocket(server: http.Server) {
  const io = new IOServer(server, {
    cors: { origin:  "http://localhost:5173/",
    methods: ["GET", "POST"] },
  });

  // optional simple per-socket rate limiting store
  const lastSentAt = new Map<string, number>();

  io.use(async (socket: Socket, next) => {
    try {
      // prefer token in handshake.auth.token (recommended for socket.io client) or Authorization header
      const token = (socket.handshake.auth && socket.handshake.auth.token) || socket.handshake.headers["authorization"]?.split(" ")[1];
      if (!token) return next(new Error("Authentication error"));

      const decoded: any = Tokens.verifyToken(token); // adjust to your verify function
      if (!decoded) return next(new Error("Invalid token"));
      socket.data.currentUser = decoded.payload ?? decoded; // accommodate payload nesting
      return next();
    } catch (err) {
      return next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    // join project room
    socket.on("joinProject", (projectId: string) => {
      if (!projectId) return;
      socket.join(`project:${projectId}`);
    });

    socket.on("leaveProject", (projectId: string) => {
      if (!projectId) return;
      socket.leave(`project:${projectId}`);
    });
       socket.on("sendMessage", (data:string) => {
       socket.emit("receiveMessage",data)
    });
    

    // Admin broadcast -> server verifies admin and then emits to room
    socket.on("broadcastMessage", async (payload: BroadcastPayload, ack?: (res: any) => void) => {
      try {
        // basic payload validation
        if (!payload?.projectId || !payload?.content) {
          if (ack) return ack({ success: false, error: "Invalid payload" });
          return;
        }

        // simple rate-limit per socket (example: 1 message / 2s)
        const sid = socket.id;
        const now = Date.now();
        const last = lastSentAt.get(sid) || 0;
        if (now - last < 2000) {
          if (ack) return ack({ success: false, error: "You're sending messages too fast" });
        }
        lastSentAt.set(sid, now);

        const currentUser = socket.data.currentUser;
        if (!currentUser) {
          if (ack) return ack({ success: false, error: "Unauthorized" });
          return;
        }

        // verify that currentUser is admin of this project
        const project = await projectSchema.findById(payload.projectId).lean();
        if (!project) {
          if (ack) return ack({ success: false, error: "Project not found" });
          return;
        }

        // compare using your schema field (handle possible naming issues)
        const adminName = project.usernameAdmin ?? project["usernameAdmin"];
        if (!adminName || adminName.toString() !== currentUser.username?.toString()) {
          if (ack) return ack({ success: false, error: "Forbidden: only project admin can broadcast" });
          return;
        }

        // create message document (optional persistence)
        const message = await messageSchema.create({
          project: payload.projectId,
          sender: currentUser.username,
          content: payload.content,
          meta: payload.meta || {},
        });

        // emit to all sockets in project room
        io.to(`project:${payload.projectId}`).emit("newMessage", {
          id: message._id,
          projectId: payload.projectId,
          sender: currentUser.username,
          content: payload.content,
          meta: payload.meta || {},
        });

        if (ack) ack({ success: true });
      } catch (err) {
        if (ack) ack({ success: false, error: (err as Error).message || "Server error" });
      }
    });

    socket.on("disconnect", () => {
      lastSentAt.delete(socket.id);
    });
 
  });

  return io;
}