import mongoose from "mongoose";
import Message from "./message.interface";

const messageSchema = new mongoose.Schema<Message>(
  {
    // Discriminator field — tells us what kind of message this is
    type: {
      type: String,
      enum: ["private", "group", "announcement"],
      required: true,
    },

    // Who sent the message (stored as username, matching Project.usernameAdmin / usernameMember)
    sender: {
      type: String,
      required: true,
      trim: true,
    },

    // Only populated for private (one-to-one) messages
    receiver: {
      type: String,
      trim: true,
      default: null,
    },

    // Only populated for group messages and announcements — references the Project document
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      default: null,
    },

    // The message body — hard-capped at 2000 characters at the schema level
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Message content cannot exceed 2000 characters"],
      default: "",
    },

    // Only used for announcements — a short headline / subject
    title: {
      type: String,
      trim: true,
      maxlength: [200, "Announcement title cannot exceed 200 characters"],
      default: null,
    },
    readBy: {
      type: [String],
      default: [],
    },
    files: {
      type: [
        {
          url: { type: String, required: true },
          public_id: { type: String, required: true },
        },
      ],
      default: [],
    },
    
  },
  {
    // Adds createdAt & updatedAt automatically — clients use createdAt to sort messages
    timestamps: true,
  },
);

// --- Indexes for fast history queries ---

// Private chat history: find all messages between User A and User B
messageSchema.index({ type: 1, sender: 1, receiver: 1 });

// Group / announcement history: find all messages for a project
messageSchema.index({ type: 1, projectId: 1 });

export default mongoose.model<Message>("Message", messageSchema);