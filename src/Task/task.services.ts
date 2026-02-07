import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
import Project from "../Project/project.interface";
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
        return next(new Error("Please add tasks to this project"));
      }
      const project =await projectSchema.findOne({_id:req.projectId?.toString()})
      const member:number= project?.usernameMember.length!;
      const pending :number= task.filter((t) => t.status === "Pending").length;
      const Inprogress:number=task.filter((t)=>t.status==="In-progress").length
      const Done:number=task.filter((t)=>t.status==="Done").length
      // we can do that in the validation section

      res.status(200).json({ data: task ,length:task.length,member:member,pending:pending,Inprogress:Inprogress,Done:Done});
    }
  );
  create = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task = await taskSchema.create({
        project: req.projectId,
        usernameMember: req.body.username,
        usernameAdmin: req.CurrentUser.username,
        name: req.body.name,
        status:req.body.status || "Pending",
        duration: req.body.duration,
        color: req.body.color || "#000000", // default color if not provided
        description: req.body.description,
      });
       const project:Project|null = await projectSchema.findById({_id:task.project.toString()})
      const tasks:Task[]|null=await taskSchema.find({project:task.project.toString()})
      const Done:number=tasks.filter((t)=>t.status==="Done").length
      const percent:number=tasks.length>0?Math.round((Done/tasks.length)*100):0
      if(project){
        project.percent=percent
        if(percent>=100){
          project.status="Done"
        }
        await project.save()
      }

      res.status(201).json({ data: task,percent:percent });
    }
  );
  delete = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const  project:Project|null = await projectSchema.findById({_id:task.project.toString()})
      const tasks:Task[]|null=await taskSchema.find({project:task.project.toString()})
      const Done:number=tasks.filter((t)=>t.status==="Done").length-1
      const percent:number=tasks.length>0?Math.round((Done/tasks.length)*100):0
      if(project){
        project.percent=percent
        if(percent>=100){
          project.status="Done"
        }
        await project.save()
      }
       await taskSchema.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Task deleted successfully" ,percent:percent});
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
  updateStatus = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const {status}=req.body
      if(status!=="Pending" && status!=="In-progress" && status!=="Done"){
        return next(new Error("Invalid status value"));
      }
      const  project:Project|null = await projectSchema.findById({_id:task.project.toString()})
      const tasks:Task[]|null=await taskSchema.find({project:task.project.toString()})
      const Done:number=tasks.filter((t)=>t.status==="Done").length
      const percent:number=tasks.length>0?Math.round((Done/tasks.length)*100):0
      console.log(percent);
      if(project){
        project.percent=percent
        if(percent>=100){
          project.status="Done"
        }
        await project.save()
      }
      const updatedTask: Task | null = await taskSchema.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      res.status(200).json({ data: updatedTask ,percent:percent });
    });
    
}
const taskServices = new TaskServices();
export default taskServices;
