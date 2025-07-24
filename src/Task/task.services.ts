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
        const username = req.body.username;
       const usernameExits = await userSchema.findOne({ username: username });
       if (!usernameExits) {
         return next(new Error("User not found"));
       }
      // we can do that in the validation section 
      const tasks: Task[] = await taskSchema.find({ username: req.body.username });
      res.status(200).json({ data: tasks });
    }
  );
  getProjectTask=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
     const projectId=req.params.projectId
    const Project:Project|null=await projectSchema.findById(projectId)
    if(!Project){
      return next(new Error("No project found"))
    }
    // we can do that in the validation section 
    const Task :Task[]= await taskSchema.find({project:projectId})
    res.status(200).json({data:Task})
  })
  create=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const task:Task=await taskSchema.create(req.body)
    res.status(201).json({data:task})
  })
  delete=AsyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    await taskSchema.findByIdAndDelete(req.params.id)
    res.status(404).json({message:"Task deleted successfully"})
  })

}

