import mongoose from "mongoose";
import Task from "./task.interface";
import express from "express";
const TaskSchema = new mongoose.Schema<Task>(
  {
    name: { type: String },
    duration: { type: String },
    color: { type: String },
    description: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" },
    usernameMember: { type: String, required: true },
    usernameAdmin: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pending", "in-progress", "done"],
      default: "pending",
    },
  },
  { timestamps: true }
);
// TaskSchema.pre<Task>(/^find/, function (next) {
//   this.populate({ path: "project", select: "name" });
//   next();
// });
const taskSchema = mongoose.model<Task>("task", TaskSchema);

export default taskSchema;
