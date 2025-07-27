import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
import Project from "../Project/project.interface";
class TaskServices {
  getAll = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const tasks: Task[] = await taskSchema.find();
      res.status(200).json({ data: tasks });
    }
  );
  getUserTasks = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
       const usernameExits = await userSchema.findOne({ username: req.body.username });
       if (!usernameExits) {
         return next(new Error("User not found"));
       }
      // we can do that in the validation section 
      const tasks: Task[] = await taskSchema.find({ username: req.body.username });
      res.status(200).json({ data: tasks });
    }
  );
  getProjectTask=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
     req.body.project=req.projectId
    const Project:Project|null=await projectSchema.findById(req.body.project)
    if(!Project){
      return next(new Error("No project found"))
    }
    // we can do that in the validation section 
    const Task :Task[]= await taskSchema.find({project:req.body.project})
    res.status(200).json({data:Task})
  })
  create=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    console.log(req.projectId)
    const task:Task=await taskSchema.create({
      project: req.projectId,
      username: req.body.username,
      name: req.body.name,
      duration: req.body.duration,
      color: req.body.color || "#000000", // default color if not provided
      description: req.body.description,
    })
    console.log(req.projectId)
    res.status(201).json({data:task})
  })
  delete=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    await taskSchema.findByIdAndDelete(req.params.id)
    res.status(200).json({message:"Task deleted successfully"})
  })
   updateTask= AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const task:Task|null=await taskSchema.findById(req.params.id)
    if(!task){
      return next(new Error("No Task "))
    }
    const updatedTask:Task|null=await taskSchema.findByIdAndUpdate(req.params.id,req.body,{new:true})
    res.status(200).json({data:updatedTask})
   })
}
const taskServices=new TaskServices()
export default taskServices
