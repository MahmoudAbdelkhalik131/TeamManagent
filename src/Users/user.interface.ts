import { Document } from "mongoose";
interface Users extends Document {
  readonly username: string;
  password: string;
  team: Users[];
  teamMates: string[];
  readonly role: "admin" | "member";
  validUser:boolean;
  verifyCode:string;
  forgetPasswordCode:string;
  email:string;
}
export default Users;
