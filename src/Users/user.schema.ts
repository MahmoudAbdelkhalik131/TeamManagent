import mongoose from "mongoose";
import Users from "./user.interface";
const UserSchema = new mongoose.Schema<Users>(
  {
    username: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { timestamps: true }
);
const userSchema = mongoose.model<Users>("user", UserSchema);
export default userSchema;
