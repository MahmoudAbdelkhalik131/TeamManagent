import express from "express";
import multer from "multer";
import  main  from "./Gemenia.connection";
import auth from "../auth/authen";
import { sendMessage } from "./Gemenia.connection";
const Googlerouter = express.Router();
const upload = multer({dest:'uploads', limits: { fileSize: 200 * 1024 * 1024 }}); // 200MB limit
Googlerouter.post("/transcribeGoogle", auth.verifyToken,upload.single("audio"), main,sendMessage);

export default Googlerouter;