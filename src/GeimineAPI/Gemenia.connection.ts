import { Request, Response, NextFunction } from "express";
import geminiService from "../utils/gemini.service";
import taskSchema from "../Task/task.schema";
import projectSchema from "../Project/project.schema";


async function Review(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }
    
    // 1. Fetch Task with populated project (basic info)
    const task = await taskSchema.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. Fetch Full Project for description/goals if not fully populated
    const project = await projectSchema.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: "Parent project not found" });
    }

    console.log(`Analyzing task "${task.name}" for project "${project.name}"`);

    // 3. Use the enhanced service with full context
    const reviewText = await geminiService.generateTaskReview(
      req.file.path,
      req.file.mimetype,
      {
        taskName: task.name,
        taskDescription: task.description || "No specific requirements provided",
        projectName: project.name,
        projectDescription: project.description || "No project brief provided"
      }
    );

    // 4. Heuristic or structured detection for verdict
    let verdict: "ACCEPT" | "REJECT" | "NONE" = "NONE";
    const upperReview = reviewText.toUpperCase();
    if (upperReview.includes("VERDICT: ACCEPT")) {
      verdict = "ACCEPT";
    } else if (upperReview.includes("VERDICT: REJECT")) {
      verdict = "REJECT";
    }

    // 5. Save to database
    await taskSchema.findByIdAndUpdate(taskId, {
      aiReview: reviewText,
      aiVerdict: verdict
    });

    res.status(200).json({ 
      message: "Context-aware AI Review generated successfully", 
      data: { review: reviewText, verdict } 
    });
  } catch (error: any) {
    console.error("Error in Context-Aware AI Review:", error.message);
    res.status(500).json({ message: "Error generating review", error: error.message });
  }
}



export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }
    const aiResponse = await geminiService.generateContent(message);
    res.status(200).json({ message: aiResponse });
  } catch (error: any) {
    res.status(500).json({ message: "AI Assistant Error", error: error.message });
  }
};

export default Review;

