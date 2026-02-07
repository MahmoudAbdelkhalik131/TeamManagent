import Project from "./project.interface";
import projectSchema from "./project.schema";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import taskSchema from "../Task/task.schema";
import Task from "../Task/task.interface";
class ProjectServices {
  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log(req.CurrentUser.username.toString());
      const project: Project[] | null = await projectSchema.find({$or:[{usernameMember:req.CurrentUser.username.toString()},{usernameAdmin:req.CurrentUser.username.toString()}]});
      if (!project) res.json({ message: "OPSss THERE IS NO DATA" });
      res.status(200).json({ data: project });
    }
  );
  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project = await projectSchema.create({usernameAdmin:req.CurrentUser.username.toString(),
        ...req.body
      });
      res.status(201).json({ data: project });
    }
  );
  deleteOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await projectSchema.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Item deleted succefully" });
    }
  );
  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project | null = await projectSchema.findById(
        req.params.id
      );
      if (!project) {
        return next(new Error("project not found"));
      }
      const taskProject=await taskSchema.find({project:project._id!.toString()})
      req.projectId = req.params.id;
      if (!taskProject) {
        return next(new Error("Please add tasks to this project"));
      }
      const member:number= project?.usernameMember.length!;
      const pending :number= taskProject.filter((t) => t.status === "Pending").length;
      const Inprogress:number=taskProject.filter((t)=>t.status==="In-progress").length
      const Done:number=taskProject.filter((t)=>t.status==="Done").length
      const percent:number=taskProject.length>0?Math.round((Done/taskProject.length)*100):0
      res.status(200).json({ data: project, tasks: taskProject ,member:member,pending:pending,Inprogress:Inprogress,Done:Done,percent:percent});
    }
  );
  updateOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project | null = await projectSchema.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true }
      );
      res.status(200).json({ data: project });
    }
  );
  AddUser = asyncHandler(
      async (req: Request, res: Response, next: NextFunction) => {
       const {usernameMember}=req.body
       const project:Project|null=await projectSchema.findById(req.params.id)
        project!.usernameMember.push(usernameMember);
        await project!.save();

        res.status(201).json({ message: "congratulation user added succefully !!!!!!!!!!!" });
      }
    );
}
const projectServices = new ProjectServices();
export default projectServices;
