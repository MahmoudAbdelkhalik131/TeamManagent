import express from "express";
import projectRouter from "./Project/project.routes";
import userRouter from "./Users/user.route";
import taskRouter from "./Task/task.routes";
declare module "express" {
  interface Request {
    projectId?: string;
  }
}
const Routes = (app: express.Application) => {
  app.use("/api/v1/project", projectRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/task", taskRouter);
};

export default Routes;
