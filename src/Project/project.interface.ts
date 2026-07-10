import { Document } from "mongoose";
import { cloudinary, CloudinaryUploadResult } from "../middlewares/cloudinary";
interface Project extends Document {
  readonly name: string;
  endDate: Date;
  status: "Active"|"Inactive"|"Done";
  duration: string;
  readonly color: string;
  readonly startDate:Date;
  readonly usernameAdmin:string;
  readonly description:string;
  percent:number;
  usernameMember: string[];
  totalTasks:number;
  adminAttatchment?: CloudinaryUploadResult[];
}
export default Project;
