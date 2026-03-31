import { Schema, model } from "mongoose";
import { IActivityLog } from "./activity.interface";

const activityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ["Project", "Task"], required: true },
  targetId: { type: String, required: true },
  targetName: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

export default model<IActivityLog>("ActivityLog", activityLogSchema);
