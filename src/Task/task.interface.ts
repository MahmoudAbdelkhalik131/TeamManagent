import { Document } from "mongoose";
import Project from "../Project/project.interface";
import { CloudinaryUploadResult } from "../middlewares/cloudinary";
interface Task extends Document {
  readonly name: string;
  duration: string;
  endDate: Date;
  task?: Task;
  readonly project: Project;
  readonly color: string;
  readonly description: string;
  readonly usernameMember: string;
  readonly usernameAdmin: string;
  startDate: Date;
  createdAt: Date,
  updatedAt: Date,
  status: "Pending" | "In-progress" | "Done" | "Reviewing" | "Accepted";
  note?: string[];
  adminAttatchment?: CloudinaryUploadResult[];
  memberAttachment?: CloudinaryUploadResult[];
  reviewCycles: number;
  firstDoneAt?: Date;
  acceptedAt?: Date;
  lastOverdueNotificationAt?: Date;
  aiReview?: string;
  aiVerdict?: "ACCEPT" | "REJECT" | "NONE";
}

export default Task;
