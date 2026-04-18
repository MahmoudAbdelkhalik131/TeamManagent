import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import { Request,Response,NextFunction } from "express";
async function Review(req: Request, res: Response,next:NextFunction) {
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    try {
      const myfile: any = await ai.files.upload({
        file: req.file?.path!,
        config: { mimeType: req.file?.mimetype },
      });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: createUserContent([
          createPartFromUri(myfile.uri, myfile.mimeType),
          "Please review the content of the files and compare them with the target of the task and give me a feedback about the quality of the work and if it is good or not and if there are any improvements that can be done to make it better and suggest after comparison if the task can considerd to be accepted or not and if not what are the reasons and what are the improvements that can be done to make it accepted",
        ]),
      });
      console.log("Transcription:", response.text);
      res.status(200).json({ message: response.text });
    } catch (error: any) {
      console.error("Error in Review:", error.message);
    }
}
export const sendMessage=async (req:Request,res:Response,next:NextFunction) => {
  res.status(200).json({message:req.body.message})
}
export default Review;
