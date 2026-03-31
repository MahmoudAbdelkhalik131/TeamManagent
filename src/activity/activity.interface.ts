import { Document, Schema } from "mongoose";

export interface IActivityLog extends Document {
  user: Schema.Types.ObjectId;
  username: string;
  action: string;
  targetType: "Project" | "Task";
  targetId: string;
  targetName: string;
  details?: any;
  createdAt: Date;
}
