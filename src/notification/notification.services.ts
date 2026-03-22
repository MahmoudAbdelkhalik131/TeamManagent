import NotificationSchema from "./notification.schema";
import { io } from "../../main";

/**
 * Creates a notification in the database and emits a socket live event
 * if the user is connected.
 * 
 * @param recipient The username of the receiver
 * @param type The type of notification (e.g. 'Task Assignment')
 * @param message The content of the notification
 * @param projectId Optional ObjectId of the related project
 * @param link Optional link to redirect the user
 */
export const createNotification = async (
  recipient: string,
  type: string,
  message: string,
  projectId?: string,
  link?: string
) => {
  try {
    const newNotification = await NotificationSchema.create({
      recipient,
      type,
      message,
      project: projectId,
      link,
    });

    // Emit live notification if the user is currently connected to Socket.io
    // (Assuming the user joins a room named exactly after their username at connection)
    io.to(recipient).emit("new_notification", newNotification);

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw for notifications so we don't break main workflows
    return null; 
  }
};

/**
 * Convenience helper to notify multiple project members at once.
 */
export const notifyProjectMembers = async (
  members: string[],
  type: string,
  message: string,
  projectId?: string,
  link?: string
) => {
  const promises = members.map((member) =>
    createNotification(member, type, message, projectId, link)
  );
  await Promise.all(promises);
};

/**
 * Retrieves past notifications for a given user.
 * 
 * @param username The username to fetch notifications for
 * @param limit Optional limit to pagination (defaults to 20)
 */
export const getUserNotifications = async (username: string, limit = 20) => {
  return await NotificationSchema.find({ recipient: username })
    .populate("project", "name color")
    .sort({ createdAt: -1 }) // newest first
    .limit(limit);
};

/**
 * Marks a specific notification as read.
 * 
 * @param notificationId The ID of the notification
 * @param username To ensure the user modifying it is the recipient
 */
export const markNotificationAsRead = async (notificationId: string, username: string) => {
  return await NotificationSchema.findOneAndUpdate(
    { _id: notificationId, recipient: username },
    { $set: { isRead: true } },
    { new: true }
  );
};

export const getUnreadNotificationCount = async (username: string) => {
  return await NotificationSchema.countDocuments({
    recipient: username,
    isRead: false,
  });
};
