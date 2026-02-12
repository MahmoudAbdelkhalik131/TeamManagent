import { Document } from "mongoose";
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

}
export default Project;
