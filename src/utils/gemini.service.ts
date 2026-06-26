import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from "fs";

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private fileManager: GoogleAIFileManager;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY!;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is not defined in environment variables");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  /**
   * Generates a review for a task submission based on file content, task, and project context.
   */
  async generateTaskReview(
    filePath: string, 
    mimeType: string, 
    context: {
      taskName: string;
      taskDescription: string;
      projectName: string;
      projectDescription: string;
    }
  ) {
    try {
      // 1. Upload the file to Google AI
      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: `Submission: ${context.taskName}`,
      });

      // 2. Get the model
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // 3. Prepare parts
      const prompt = `
        You are an Expert Project Quality Auditor. Your goal is to review a task submission and ensure it aligns with both the specific task requirements and the overall project objectives.

        PROJECT CONTEXT:
        - Project Name: ${context.projectName}
        - Project Brief: ${context.projectDescription}

        TASK CONTEXT:
        - Task Name: ${context.taskName}
        - Task Requirements: ${context.taskDescription}
        
        CRITERIA:
        1. Accuracy: Does the work meet the task requirements?
        2. Project Alignment: Does this work contribute correctly to the overall project brief?
        3. Professionalism: Is the submission formatted and structured well?

        Provide a structured review in the following format:
        1. **Quality Analysis**: Detailed evaluation of the work.
        2. **Project Alignment**: How well this fits into the "${context.projectName}" project.
        3. **Improvement Suggestions**: Specific, actionable feedback.
        4. **Verdict**: Clearly state "VERDICT: ACCEPT" or "VERDICT: REJECT" with a 1-sentence summary.
        
        Keep the tone professional and constructive.
      `;

      // 4. Generate content
      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResult.file.mimeType,
            fileUri: uploadResult.file.uri,
          },
        },
        { text: prompt },
      ]);

      return result.response.text();
    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      throw new Error(`Failed to generate AI review: ${error.message}`);
    }
  }


  /**
   * Analyzes dashboard performance data and returns insights.
   */
  async analyzeDashboard(stats: any, teamPerformance?: any) {
    try {
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: "You are a data analyst specialized in team productivity. Analyze the provided metrics and give 3-4 concise, actionable insights or highlights."
      });

      const prompt = `
        Here are the current team statistics:
        ${JSON.stringify(stats, null, 2)}
        
        Team Performance:
        ${JSON.stringify(teamPerformance, null, 2)}
        
        Please provide a summary of how the team is doing, identifying any bottlenecks or top performers. Use a professional, motivating tone.
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini Dashboard Analysis Error:", error);
      return "Unable to generate insights at this time.";
    }
  }

  /**
   * Simple content generation for general messages.
   */
  async generateContent(prompt: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini Service Error:", error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
