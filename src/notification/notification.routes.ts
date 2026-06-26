import { Router } from "express";
import { getMyNotifications, markAsRead, getUnreadCount,markAllNotificationAsReads } from "./notification.controller";
import auth from "../auth/auth.middleware";

const NotificationRoutes = Router();

// Protect all notification routes
NotificationRoutes.use(auth.verifyToken);

// Route to get all notifications for the logged in user
NotificationRoutes.get("/", getMyNotifications);
NotificationRoutes.patch("/mark-all-as-read",markAllNotificationAsReads );

// Route to get unread count
NotificationRoutes.get("/unread-count", getUnreadCount);

// Route to mark a specific notification as read
NotificationRoutes.patch("/:id/read", markAsRead);


export default NotificationRoutes;
