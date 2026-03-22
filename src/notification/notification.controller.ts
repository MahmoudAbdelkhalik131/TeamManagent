import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import * as NotificationService from "./notification.services";
import { ErrorHandler } from "../middlewares/errorHandler";

/**
 * @desc Get notifications for logged in user
 * @route GET /api/v1/notifications
 * @access Private
 */
export const getMyNotifications = expressAsyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - Assuming req.user is populated by your Auth middleware
  const username = req.CurrentUser?.username;

  if (!username) {
    throw new ErrorHandler(401, "Not authorized to access this route");
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const notifications = await NotificationService.getUserNotifications(username, limit);

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: notifications,
  });
});

/**
 * @desc Mark a specific notification as read
 * @route PATCH /api/v1/notifications/:id/read
 * @access Private
 */
export const markAsRead = expressAsyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore - Assuming req.user is populated by your Auth middleware
  const username = req.CurrentUser?.username;

  if (!username) {
    throw new ErrorHandler(401, "Not authorized to access this route");
  }

  const { id } = req.params;

  const updatedNotification = await NotificationService.markNotificationAsRead(id, username);

  if (!updatedNotification) {
    throw new ErrorHandler(404, "Notification not found or you are not the recipient");
  }

  res.status(200).json({
    status: "success",
    data: updatedNotification,
  });
});

/**
 * @desc Get unread notifications count
 * @route GET /api/v1/notifications/unread-count
 * @access Private
 */
export const getUnreadCount = expressAsyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const username = req.CurrentUser?.username;

  if (!username) {
    throw new ErrorHandler(401, "Not authorized");
  }

  const count = await NotificationService.getUnreadNotificationCount(username);

  res.status(200).json({
    status: "success",
    data: { count },
  });
});
