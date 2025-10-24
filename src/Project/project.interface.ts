import { Document } from "mongoose";
interface Project extends Document {
  readonly name: string;
  readonly duration: string;
  readonly color: string;
  readonly usernameAdmin:string;
  readonly description:string;
  readonly usernameMember:string;
}
export default Project;
