import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
import Project from "../Project/project.interface";
import { getDaysDifference, isFutureDate } from "../utils/dateHandler";
import { ErrorHandler } from "../middlewares/errorHandler";
import { log } from "console";
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
      tasks.forEach(async (task) => {
        if (isFutureDate(task.endDate)) {
          task.duration =
            getDaysDifference(
              new Date(Date.now()),
              new Date(task.endDate),
            )?.toString() + "days" || "0 days";
          await task.save();
        } else {
          task.duration = "0 days";
          await task.save();
        }
      });

      res.status(200).json({ data: tasks.sort, NumberofTasks: tasks.length });
    },
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
      const tasks: Task[] = await taskSchema.find({
        $or: [
          { usernameMember: req.CurrentUser.username.toString() },
          { usernameAdmin: req.CurrentUser.username.toString() },
        ],
      });
      
       const bulkOps = tasks.map((t) => {
      const duration = isFutureDate(t.endDate)
        ? (getDaysDifference(
            new Date(Date.now()),
            new Date(t.endDate),
          )?.toString() || "0") + " Days"
        : "0 days";

      return {
        updateOne: {
          filter: { _id: t._id },
          update: { $set: { duration } },
        },
      };
    });

    if (bulkOps.length > 0) {
      await taskSchema.bulkWrite(bulkOps);
    }
const tasks1: Task[] = await taskSchema.find({
        $or: [
          { usernameMember: req.CurrentUser.username.toString() },
          { usernameAdmin: req.CurrentUser.username.toString() },
        ],
      });

      res.status(200).json({ data: tasks1, NumberofTasks: tasks1.length });
    },
  );
  getProjectTask = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const tasks: Task[] | null = await taskSchema.find({
        project: req.projectId?.toString(),
      });
      if (!tasks) {
        return next(new Error("Please add tasks to this project"));
      }
      tasks.forEach(async (task) => {
        if (isFutureDate(task.endDate)) {
          task.duration =
            getDaysDifference(
              new Date(Date.now()),
              new Date(task.endDate),
            )?.toString() + "days" || "0 days";
        } else {
          task.duration = "0 days";
        }
        await task.save();
      });
      const project = await projectSchema.findOne({
        _id: req.projectId?.toString(),
      });
      const member: number = project?.usernameMember.length!;
      const pending: number = tasks.filter(
        (t) => t.status === "Pending",
      ).length;
      const Inprogress: number = tasks.filter(
        (t) => t.status === "In-progress",
      ).length;
      const Done: number = tasks.filter((t) => t.status === "Done").length;
      // we can do that in the validation section

      res.status(200).json({
        data: tasks,
        length: tasks.length,
        member: member,
        pending: pending,
        Inprogress: Inprogress,
        Done: Done,
      });
    },
  );
  create = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task = await taskSchema.create({
        project: req.projectId,
        usernameMember: req.body.username,
        usernameAdmin: req.CurrentUser.username,
        name: req.body.name,
        status: req.body.status || "Pending",
        endDate: req.body.endDate,
        duration:getDaysDifference(new Date(Date.now()),new Date(req.body.endDate))?.toString()+" Days",
        color: req.body.color || "#000000", // default color if not provided
        description: req.body.description,
      });

      const project: Project | null = await projectSchema.findById({
        _id: task.project._id
      });
      if (new Date(project?.endDate!) <= new Date(task.endDate)) {
        return next(
          new ErrorHandler(
            400,
            "Task end date cannot be after project end date",
          ),
        );
      }
      const tasks: Task[] | null = await taskSchema.find({
        project: task.project.toString(),
      });
      const Done: number = tasks.filter((t) => t.status === "Done").length;
      const percent: number =
        tasks.length > 0 ? Math.round((Done / tasks.length) * 100) : 0;
      if (project) {
        project.percent = percent;
        if (percent >= 100) {
          project.status = "Done";
        } else {
          project.status = "Active";
        }
        await task.save();
        await project.save();
      }
      res.status(201).json({ data: task, percent: percent });
    },
  );
  delete = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id.toString());
      console.log(task)
      if (!task) {
        return next(new Error("No Task "));
      }
      const project: Project | null = await projectSchema.findOne({
        _id: task.project._id
      });
      const tasks: Task[] | null = await taskSchema.find({
        project: task.project._id,
      });
      const Done: number = tasks.filter((t) => t.status === "Done").length - (task.status === "Done" ? 1 : 0);
      const percent: number =
        tasks.length > 0 ? Math.round((Done / tasks.length) * 100) : 0;
      if (project) {
        project.percent = percent;
        if (percent >= 100) {
          project.status = "Done";
        } else {
          project.status = "Active";
        }
        await project.save();
      }
      if(task.usernameAdmin.toString() !== req.CurrentUser.username.toString()){
        return next(new ErrorHandler(401, "You aren't authorized to delete this task"));
      }
      await taskSchema.findByIdAndDelete(req.params.id);
      res
        .status(200)
        .json({ message: "Task deleted successfully", percent: percent });
    },
  );
  updateTask = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const { status } = req.body;
      if (status && req.CurrentUser.role === "admin") {
        return next(new Error("Admin cannot update task status ده انت عمدة"));
      }
      const updatedTask: Task | null = await taskSchema.findByIdAndUpdate(
        req.params.id,
         req.body
        ,
        { new: true },
      );
      if(!updatedTask){
        return next(new Error("Task not found"));
      }
      updatedTask.duration! = getDaysDifference(new Date(Date.now()),new Date(updatedTask?.endDate!))?.toString()+" Days"||"0 Days"
      await updatedTask?.save({validateModifiedOnly:true})
      res.status(200).json({ data: updatedTask });
    },
  );
  updateStatus = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const { status } = req.body;
      if (
        status !== "Pending" &&
        status !== "In-progress" &&
        status !== "Done"
      ) {
        return next(new Error("Invalid status value"));
      }
      const project: Project | null = await projectSchema.findById({
        _id: task.project._id.toString(),
      });
      const tasks: Task[] | null = await taskSchema.find({
        project: task.project._id.toString(),
      });
      const Done: number = tasks.filter((t) => t.status === "Done").length;
      const percent: number =
        tasks.length > 0 ? Math.round((Done / tasks.length) * 100) : 0;
      console.log(percent);
      if (project) {
        project.percent = percent;
        if (percent >= 100) {
          project.status = "Done";
        } else {
          project.status = "Active";
        }
        await project.save();
      }
      const updatedTask: Task | null = await taskSchema.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      );
      res.status(200).json({ data: updatedTask, percent: percent });
    },
  );
}
const taskServices = new TaskServices();
export default taskServices;
