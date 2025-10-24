import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import Features from "../utils/features";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
class TaskServices {
  setId(req: Request, res: Response, next: NextFunction) {
    if (req.params.projectId) {
      req.projectId = req.params.projectId.toString();
    } else if (!req.params.projectId) {
      return next(new Error("Project ID is required"));
    }
    next();
  }
  getAll = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const tasks: Task[] = await taskSchema.find({ project: req.projectId });
      const features =new Features(projectSchema.find({$or:[{usernameMember:req.CurrentUser.username.toString()},{usernameِAdmin:req.CurrentUser.username.toString()}]}),req.query).search();
      res.status(200).json({ data: tasks ,NumberofTasks:tasks.length});
    }
  );
  getUserTasks = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const usernameExits = await userSchema.findOne({
        username: req.CurrentUser.username,
      });
      if (!usernameExits) {
        return next(new Error("User not found"));
      }
      // we can do that in the validation section
      const tasks: Task[] = await taskSchema.find({$or:[{usernameMember:req.CurrentUser.username.toString()},{usernameAdmin:req.CurrentUser.username.toString()}]});
      res.status(200).json({ data: tasks });
    }
  );
  getProjectTask = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task []| null = await taskSchema.find({
        project: req.projectId?.toString(),
      });
      if (!task) {
        return next(new Error("No tasks for this project"));
      }
      // we can do that in the validation section
      res.status(200).json({ data: task });
    }
  );
  create = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task = await taskSchema.create({
        project: req.projectId,
        usernameMember: req.body.username,
        usernameAdmin: req.CurrentUser.username,
        name: req.body.name,
        duration: req.body.duration,
        color: req.body.color || "#000000", // default color if not provided
        description: req.body.description,
      });

      res.status(201).json({ data: task });
    }
  );
  delete = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await taskSchema.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Task deleted successfully" });
    }
  );
  updateTask = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const updatedTask: Task | null = await taskSchema.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      res.status(200).json({ data: updatedTask });
    }
  );
}
const taskServices = new TaskServices();
export default taskServices;
