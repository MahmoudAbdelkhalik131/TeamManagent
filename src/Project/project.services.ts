import Project from "./project.interface";
import projectSchema from "./project.schema";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import taskSchema from "../Task/task.schema";
import Task from "../Task/task.interface";
import { getDaysDifference } from "../utils/dateHandler";
import { notifyProjectMembers, createNotification } from "../notification/notification.services";
class ProjectServices {
  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log(req.CurrentUser.username.toString());
      const project: Project[] | null = await projectSchema.find({
        $or: [
          { usernameMember: req.CurrentUser.username.toString() },
          { usernameAdmin: req.CurrentUser.username.toString() },
        ],
      });
      if (!project) res.json({ message: "OPSss THERE IS NO DATA" });
      project.forEach(async (p) => {
        if (p.endDate > new Date(Date.now())) {
          p.duration = p.endDate
            ? Math.ceil(
                (p.endDate.getTime() - new Date().getTime()) /
                  (1000 * 3600 * 24),
              ) + " day(s)"
            : "No End Date";
        } else {
          p.duration = "No End Date";
          p.status = "Inactive";
        }
        await p.save();
      });
      res.status(200).json({ data: project });
    },
  );
  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project = await projectSchema.create({
        usernameAdmin: req.CurrentUser.username.toString(),
        ...req.body,
      });
      project.duration =
        getDaysDifference(new Date(Date.now()), project.endDate)?.toString()! +
        " Days";
      await project.save();

      // Notify the members added to this new project
      await notifyProjectMembers(
        project.usernameMember,
        "Project Assigned",
        `You have been added to a new project: ${project.name}`,
        project._id.toString()
      );

      res.status(201).json({ data: project });
    },
  );
  deleteOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await taskSchema.deleteMany({ project: req.params.id });
      await projectSchema.findByIdAndDelete(req.params.id);
      res.status(200).json({ message: "Item deleted succefully" });
    },
  );
  getOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project | null = await projectSchema.findById(
        req.params.id,
      );
      if (!project) {
        return next(new Error("project not found"));
      }
      project.duration =
        getDaysDifference(new Date(Date.now()), project.endDate)?.toString()! +
        " Days";
      await project.save();
      const taskProject = await taskSchema.find({
        project: project._id!.toString(),
      });
      req.projectId = req.params.id;
      if (!taskProject) {
        return next(new Error("Please add tasks to this project"));
      }
      const member: number = project?.usernameMember.length!;
      const pending: number = taskProject.filter(
        (t) => t.status === "Pending",
      ).length;
      const Inprogress: number = taskProject.filter(
        (t) => t.status === "In-progress",
      ).length;
      const Done: number = taskProject.filter(
        (t) => t.status === "Done",
      ).length;
      const percent: number =
        taskProject.length > 0
          ? Math.round((Done / taskProject.length) * 100)
          : 0;
      res.status(200).json({
        data: project,
        tasks: taskProject,
        member: member,
        pending: pending,
        Inprogress: Inprogress,
        Done: Done,
        percent: percent,
      });
    },
  );
  updateOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project: Project | null = await projectSchema.findByIdAndUpdate(
        { _id: req.params.id },
        req.body,
        { new: true },
      );
      if (!project) {
        return next(new Error("project not found"));
      }
      project.duration! =
        getDaysDifference(
          new Date(Date.now()),
          new Date(project?.endDate!),
        )?.toString() + " Days" || "0 Days";
      await project?.save({ validateModifiedOnly: true });

      // Notify members that project was updated
      if (project) {
        await notifyProjectMembers(
          project.usernameMember,
          "Project Updated",
          `The project '${project.name}' has been updated.`,
          project._id.toString()
        );
      }

      res.status(200).json({ data: project });
    },
  );
  AddUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { usernameMember } = req.body;
      const project: Project | null = await projectSchema.findById(
        req.params.id,
      );
      project!.usernameMember.push(usernameMember);
      await project!.save();

      // Notify the newly added user
      await createNotification(
        usernameMember,
        "Project Assigned",
        `You have been added to the project: ${project!.name}`,
        project!._id.toString()
      );

      res
        .status(201)
        .json({ message: "congratulation user added succefully !!!!!!!!!!!" });
    },
  );
}
const projectServices = new ProjectServices();
export default projectServices;
