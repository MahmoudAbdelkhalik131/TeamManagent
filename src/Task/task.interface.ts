import { Document } from "mongoose";
import Project from "../Project/project.interface";
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
  readonly status: "Pending"|"In-progress"|"Done";
}
export default Task;
