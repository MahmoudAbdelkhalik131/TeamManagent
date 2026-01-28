import mongoose from "mongoose";
import Users from "./user.interface";
const UserSchema = new mongoose.Schema<Users>(
  {
    username: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    validUser:{type:Boolean,default:false},
    verifyCode:{type:String},
    forgetPasswordCode:{type:String},
    email:{type:String,unique:true}
  },
  { timestamps: true }
);
const userSchema = mongoose.model<Users>("user", UserSchema);
export default userSchema;
