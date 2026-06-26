import mongoose from "mongoose";
import Users from "./user.interface";
const UserSchema = new mongoose.Schema<Users>(
  {
    username: { type: String, unique: true },
    fullName: { type: String },
    password: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    validUser: { type: Boolean, default: false },
    verifyCode: { type: String },
    forgetPasswordCode: { type: String },
    email: { type: String, unique: true },
    teamMates: { type: [String], default: [] },
    avatar: { type: String, default: null },         // Cloudinary secure_url
    avatarPublicId: { type: String, default: null }, // Cloudinary public_id
  },
  { timestamps: true },
);
const userSchema = mongoose.model<Users>("user", UserSchema);
export default userSchema;
