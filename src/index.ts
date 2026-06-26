import express from "express";
import projectRouter from "./Project/project.routes";
import userRouter from "./Users/user.route";
import taskRouter from "./Task/task.routes";
import errorHandler from "./middlewares/errorHandler";
import profileRouter from "./profile/profile.routes";
import dashboardRouter from "./Dashboard/Dashboard.routes";
import chatRouter from "./chat/chat.routes";
import notificationRouter from "./notification/notification.routes";
import geminiRouter from "./GeimineAPI/Gemenia.routes";

declare module "express" {
  interface Request {
    projectId?: string;
    CurrentUser?: any;
  }
}
const Routes = (app: express.Application) => {
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
  });
  app.use("/api/v1/project", projectRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/task", taskRouter);
  app.use("/api/v1/profile",profileRouter)
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/notifications", notificationRouter);
  app.use("/api/v1/gemini", geminiRouter);
  app.use(errorHandler)

};

export default Routes;
