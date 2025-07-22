"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const TaskSchema = new mongoose_1.default.Schema({
    name: { type: String },
    duration: { type: String },
    color: { type: String },
    description: { type: String },
    project: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "project" },
}, { timestamps: true });
TaskSchema.pre(/^find/, function (next) {
    this.populate({ path: "project", select: "name" });
    next();
});
const taskSchema = mongoose_1.default.model("task", TaskSchema);
exports.default = taskSchema;
