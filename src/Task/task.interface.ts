import { Document } from "mongoose";
import Project from "../Project/project.interface";
interface Task extends Document {
  readonly name: string;
  readonly duration: string;
  readonly project: Project;
  readonly color: string;
  readonly description: string;
  readonly username: string;
  readonly status: string;
}
export default Task;
