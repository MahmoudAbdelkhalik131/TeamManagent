import Project from "./project.interface";
import projectSchema from "./project.schema";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import Features from "../utils/features";
class ProjectServices {
  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project[] | null = await projectSchema.find({$or:[{usernameMember:req.CurrentUser.username.toString()},{usernameِAdmin:req.CurrentUser.username.toString()}]});
             const features =new Features(projectSchema.find({$or:[{usernameMember:req.CurrentUser.username.toString()},{usernameAdmin:req.CurrentUser.username.toString()}]}),req.query).search();

      console.log(project[0].usernameAdmin)
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
        return next(new Error("priject not found"));
      }
      req.projectId = req.params.id;
      console.log(req.projectId);
      res.status(200).json({ data: project });
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
}
const projectServices = new ProjectServices();
export default projectServices;
