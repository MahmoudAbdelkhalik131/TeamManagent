import { Document } from "mongoose";
import Project from "../Project/project.interface";
interface Task extends Document {
  readonly name: string;
  readonly duration: Date;
  readonly project: Project;
  readonly color: string;
  readonly description: string;
  readonly usernameMember: string;
  readonly usernameAdmin: string;
  readonly status: "Pending"|"In-progress"|"Done";
}
export default Task;
