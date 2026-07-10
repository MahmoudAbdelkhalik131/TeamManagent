import mongoose from "mongoose";
import Project from "./project.interface";
const ProjectSchema = new mongoose.Schema<Project>(
  {
    name: { type: String, unique: true },
    duration: { type: String },
    endDate: {
      type: Date,
      set: (val: string | Date) => {
        // تحويل string إلى Date تلقائياً عند الحفظ
        if (typeof val === "string") {
          const date = new Date(val);
          return isNaN(date.getTime()) ? null : date;
        }
        return val;
      },
    },
    startDate:{type:Date },
    color: { type: String },
    usernameAdmin: { type: String },
    description: { type: String },
    usernameMember: { type: [String], required: true },
    percent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Done"],
      default: "Active",
    },
    totalTasks: { type: Number, default: 0 },
    adminAttatchment: [
      {
        public_id: { type: String }, // use this to delete the file later
        secure_url: { type: String }, // the public HTTPS URL
        resource_type: { type: String },
        format: { type: String },
        bytes: { type: Number },
      },
    ],
  },
  { timestamps: true },
);
const projectSchema = mongoose.model<Project>("project", ProjectSchema);
export default projectSchema;
