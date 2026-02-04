import mongoose from "mongoose";
import Project from "./project.interface";
const ProjectSchema = new mongoose.Schema<Project>(
  {
    name: { type: String, unique: true },
    duration: { 
      type: Date,
      set: (val: string | Date) => {
        // تحويل string إلى Date تلقائياً عند الحفظ
        if (typeof val === 'string') {
          const date = new Date(val);
          return isNaN(date.getTime()) ? null : date;
        }
        return val;
      }
    },
    color: { type: String },
    usernameAdmin: { type: String },
    description:{type:String},
    usernameMember: { type: [String], required: true },
    status:{type:String,enum:["Active","Inactive","Done"],default:"Active"}
  },
  { timestamps: true }
);
const projectSchema = mongoose.model<Project>("project", ProjectSchema);
export default projectSchema;
