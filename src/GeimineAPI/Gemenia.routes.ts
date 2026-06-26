import express from "express";
import multer from "multer";
import  main  from "./Gemenia.connection";
import auth from "../auth/auth.middleware";
import { sendMessage } from "./Gemenia.connection";
const Googlerouter = express.Router();
const upload = multer({dest:'uploads', limits: { fileSize: 200 * 1024 * 1024 }}); // 200MB limit

// AI Task Analysis
Googlerouter.post("/review", auth.verifyToken, upload.single("file"), main);

// AI Chat Assistant
Googlerouter.post("/assistant", auth.verifyToken, sendMessage);

export default Googlerouter;
