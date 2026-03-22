import mongoose, { Document } from "mongoose";

// The three types of messages supported by the chat system
export type MessageType = "private" | "group" | "announcement";

interface Message extends Document {
  type: MessageType;

  // The username of the user who sent the message
  sender: string;

  // Only set for private (one-to-one) messages
  receiver?: string;
  role: "admin" | "member"; // Only set for group messages to indicate sender's role

  // Set for group messages and announcements (links to a Project)
  projectId?: mongoose.Types.ObjectId;

  // The actual text content of the message
  content: string;

  // Only set for announcements — a short subject line
  readonly title?: string;
  readonly readBy?: string[];

  // Mongoose adds these automatically via { timestamps: true }
  createdAt: Date;
  updatedAt: Date;
}

export default Message;