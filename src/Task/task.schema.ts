import mongoose from "mongoose";
import Task from "./task.interface";
import express from "express";
const TaskSchema = new mongoose.Schema<Task>(
  {
    name: { type: String },
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
    description: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" },
    usernameMember: { type: String, required: true },
    usernameAdmin: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "In-progress", "Done"],
      default: "Pending",
    },
  },
  { timestamps: true }
);
TaskSchema.pre<Task>(/^find/,  function (next) {
  this.populate({ path: "project", select:"name usernameMember usernameAdmin"});
  next();
});
const taskSchema = mongoose.model<Task>("task", TaskSchema);

export default taskSchema;
