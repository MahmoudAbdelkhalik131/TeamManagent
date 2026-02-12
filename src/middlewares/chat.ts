import { Socket } from "socket.io";
import { io } from "../../main";
import Token from "./Tokens";
import dotenv from "dotenv";
import { ErrorHandler } from "./errorHandler";
dotenv.config();
// --- تعريف الواجهات (Interfaces) ---

interface UserPayload {
  id: string;
  name: string;
  role: "admin" | "member";
}

// توسيع واجهة Socket لتشمل بيانات المستخدم
interface CustomSocket extends Socket {
  user?: UserPayload;
}

// واجهات البيانات المرسلة عبر الأحداث
interface GroupMessageData {
  projectId: string;
  content: string;
}

interface PrivateMessageData {
  receiverId: string;
  content: string;
}

interface AnnouncementData {
  projectId: string;
  title: string;
  content: string;
}

// ==========================================================
// 1. MIDDLEWARE: التحقق من الهوية
// ==========================================================
io.use((socket: CustomSocket, next) => {
  try {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // تأكد من وجود JWT_SECRET في ملف .env
    const decoded = Token.verifyToken(token) as UserPayload;
    if (!decoded) {
      return next(new Error("Authentication error: Invalid Token"));
    }

    // تخزين البيانات في الـ socket object
    socket.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid Token"));
  }
});

// ==========================================================
// 2. CONNECTION: إدارة الأحداث
// ==========================================================
io.on("connection", (socket: CustomSocket) => {
  // بما أننا استخدمنا Middleware، فنحن نضمن وجود socket.user
  const user = socket.user!;
  const userId = user.id;

  // A. الانضمام للغرفة الشخصية
  socket.join(userId);
  console.log(`🚀 User connected: ${user.name} [ID: ${userId}]`);

  // B. الانضمام لغرفة مشروع
  socket.on("join_project", (projectId: string) => {
    socket.join(projectId);
    console.log(`📁 ${user.name} joined Project: ${projectId}`);
  });

  // C. إرسال رسالة للمشروع (Group Chat)
  socket.on("send_group_message", async (data: GroupMessageData) => {
    const { projectId, content } = data;

    // TODO: (Database Logic)
    // const savedMsg = await GroupMessage.create({ sender: userId, project: projectId, content });

    io.to(projectId).emit("receive_group_message", {
      sender: { id: userId, name: user.name },
      content: content,
      timestamp: new Date().toISOString(),
    });
  });

  // D. إرسال إعلان هام (Admin Only)
  socket.on("send_announcement", (data: AnnouncementData) => {
    const { projectId, title, content } = data;

    if (user.role !== "admin") {
      return socket.emit("error_message", "غير مصرح لك بإرسال إعلانات!");
    }

    io.to(projectId).emit("receive_announcement", {
      sender: "System Admin",
      title: title,
      content: content,
      isImportant: true,
      timestamp: new Date().toISOString(),
    });
  });

  // E. إرسال رسالة خاصة (One-to-One)
  socket.on("send_private_message", (data: PrivateMessageData) => {
    const { receiverId, content } = data;

    // إرسال للمستقبل (عن طريق غرفته الخاصة)
    io.to(receiverId).emit("receive_private_message", {
      sender: { id: userId, name: user.name },
      content: content,
      timestamp: new Date().toISOString(),
    });

    // تأكيد الإرسال للمرسل
    socket.emit("message_sent_ack", { to: receiverId, status: "sent" });
  });

  socket.on("disconnect", (reason) => {
    console.log(`👋 User disconnected: ${user.name} | Reason: ${reason}`);
  });
});
