import mongoose from "mongoose";
import Task from "./task.interface";
import express from "express";
const TaskSchema = new mongoose.Schema<Task>(
  {
    name: { type: String },
    duration: { type: String},
    endDate: { 
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
    task:{type:mongoose.Schema.Types.ObjectId,ref:"task"},
    startDate:{type:Date,required:true},
    color: { type: String },
    description: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "project" },
    usernameMember: { type: String, required: true },
    usernameAdmin: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "In-progress", "Done", "Reviewing", "Accepted"],
      default: "Pending",
    },
    note: { type: String },
        attachments: [
      {
        public_id: { type: String }, // use this to delete the file later
        secure_url: { type: String }, // the public HTTPS URL
        resource_type: { type: String },
        format: { type: String },
        bytes: { type: Number },
      },
    ],
  adminFiles:{type:Boolean,default:false},
  memberFiles:{type:Boolean,default:false},
  reviewCycles: { type: Number, default: 0 },
  firstDoneAt: { type: Date },
  acceptedAt: { type: Date },
  lastOverdueNotificationAt: { type: Date },
  aiReview: { type: String },
  aiVerdict: { 
    type: String, 
    enum: ["ACCEPT", "REJECT", "NONE"], 
    default: "NONE" 
  }
  },

  { timestamps: true }
);
TaskSchema.pre<Task>(/^find/,  function (next) {
  this.populate({ path: "project", select:"name usernameMember usernameAdmin"});
  next();
});
const taskSchema = mongoose.model<Task>("task", TaskSchema);

export default taskSchema;
