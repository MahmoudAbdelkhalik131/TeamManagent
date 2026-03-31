import { Document } from "mongoose";
import { CloudinaryUploadResult } from "../middlewares/cloudinary";
interface Project extends Document {
  readonly name: string;
  endDate: Date;
  status: "Active"|"Inactive"|"Done";
  duration: string;
  readonly color: string;
  readonly usernameAdmin:string;
  readonly description:string;
  percent:number;
  readonly usernameMember: string[];
  totalTasks:number;
  attachments?: CloudinaryUploadResult[];
}
export default Project;
