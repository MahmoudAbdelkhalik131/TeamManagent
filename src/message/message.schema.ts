import mongoose from "mongoose";
import Message from "./message.interface";
const messageSchema = new mongoose.Schema<Message>({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  meta: { type: Object, default: {} },
},{timestamps:true});

export default mongoose.model("Message", messageSchema);