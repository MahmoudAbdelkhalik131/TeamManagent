import { Document } from "mongoose";
interface Project extends Document {
  readonly name: string;
  status: "Active"|"Inactive"|"Done";
  readonly duration: Date;
  readonly color: string;
  readonly usernameAdmin:string;
  readonly description:string;
  percent:number;
  readonly usernameMember: string[];

}
export default Project;
