import { Document, Types } from "mongoose";

interface Notification extends Document {
  recipient: string; // username of the receiver
  project?: Types.ObjectId; // Optional project reference
  type: string; // e.g., 'Task Assignment', 'Project Update'
  message: string;
  isRead: boolean;
  link?: string; // Optional link to redirect the user
  createdAt: Date;
  updatedAt: Date;
}

export default Notification;
