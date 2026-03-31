import { Document } from "mongoose";
import Project from "../Project/project.interface";
import { CloudinaryUploadResult } from "../middlewares/cloudinary";
interface Task extends Document {
  readonly name: string;
  duration: string;
  endDate:Date;
  readonly project: Project;
  readonly color: string;
  readonly description: string;
  readonly usernameMember: string;
  readonly usernameAdmin: string;
  createdAt:Date,
  updatedAt:Date,
  status: "Pending" | "In-progress" | "Done" | "Reviewing" | "Accepted";
  note?: string;
  attachments?: CloudinaryUploadResult[];
  adminFiles:boolean
  memberFiles:boolean;
  reviewCycles: number;
  firstDoneAt?: Date;
  lastOverdueNotificationAt?: Date;
}
export default Task;
