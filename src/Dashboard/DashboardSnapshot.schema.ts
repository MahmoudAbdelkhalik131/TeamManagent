import mongoose, { Schema } from "mongoose";
import { DashboardSnapshot } from "./DashboardSnapshot.interface";

const DashboardSnapshotSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["member", "admin"],
      required: true,
    },
    snapshotDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

// Add index for expiration (3 months = 90 days)
// We'll also handle manual cleanup just in case
DashboardSnapshotSchema.index({ snapshotDate: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const dashboardSnapshotSchema = mongoose.model<DashboardSnapshot>(
  "DashboardSnapshot",
  DashboardSnapshotSchema
);

export default dashboardSnapshotSchema;
