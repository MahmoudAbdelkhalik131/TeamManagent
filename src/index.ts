import express from "express";
import projectRouter from "./Project/project.routes";
import userRouter from "./Users/user.route";
import taskRouter from "./Task/task.routes";
import errorHandler from "./middlewares/errorHandler";
declare module "express" {
  interface Request {
    projectId?: string;
    CurrentUser?: any;
  }
}
const Routes = (app: express.Application) => {
  app.use("/api/v1/project", projectRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/task", taskRouter);
  app.use(errorHandler)
};

export default Routes;
