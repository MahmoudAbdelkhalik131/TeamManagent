import mongoose from "mongoose";
import Notification from "./notification.interface";

const NotificationSchema = new mongoose.Schema<Notification>(
  {
    recipient: { 
      type: String, 
      required: true,
      index: true 
    },
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "project" 
    },
    type: { 
      type: String, 
      required: true 
    },
    message: { 
      type: String, 
      required: true 
    },
    isRead: { 
      type: Boolean, 
      default: false 
    },
    link: { 
      type: String 
    }
  },
  { timestamps: true }
);

const notificationSchema = mongoose.model<Notification>("notification", NotificationSchema);

export default notificationSchema;
