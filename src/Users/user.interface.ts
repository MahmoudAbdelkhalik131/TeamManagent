import { Document } from "mongoose";
interface Users extends Document {
  readonly username: string;
  password: string;
  team: Users[];
  readonly role: "admin" | "member";
}

export default Users;
