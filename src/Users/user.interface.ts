import { Document } from "mongoose";
interface Users extends Document {
  readonly username: string;
  readonly fullName: string;
  password: string;
  team: Users[];
  teamMates: string[];
  readonly role: "admin" | "member";
  validUser:boolean;
  verifyCode:string;
  forgetPasswordCode:string;
  email:string;
  avatar?: string;        // Cloudinary secure_url
  avatarPublicId?: string; // Cloudinary public_id (for deletion)
}
export default Users;
