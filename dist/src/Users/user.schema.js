"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
}, { timestamps: true });
const userSchema = mongoose_1.default.model('user', UserSchema);
exports.default = userSchema;
