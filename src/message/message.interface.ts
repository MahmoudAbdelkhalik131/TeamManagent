import mongoose, { Document } from "mongoose";
interface Message extends Document{
      project: mongoose.Schema.Types.ObjectId,
      sender: string,
      content: string,
      meta: object,
}
export default Message