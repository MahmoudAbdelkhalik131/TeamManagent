import Project from "./project.interface";
import projectSchema from "./project.schema";
import asyncHandler from "express-async-handler";
import { Request, Response, NextFunction } from "express";
import taskSchema from "../Task/task.schema";
import Task from "../Task/task.interface";
import { getDaysDifference } from "../utils/dateHandler";
import { notifyProjectMembers, createNotification } from "../notification/notification.services";
import userSchema from "../Users/user.schema";
import ActivityService from "../activity/activity.services";
import { ErrorHandler } from "../middlewares/errorHandler";
import { cloudinary, CloudinaryUploadResult, uploadToCloudinary } from "../middlewares/cloudinary";
class ProjectServices {
  getAll = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const projects: Project[] = await projectSchema.find({
        $or: [
          { usernameMember: req.CurrentUser.username.toString() },
          { usernameAdmin: req.CurrentUser.username.toString() },
        ],
      });

      const updatedProjects = projects.map((p) => {
        const project = p.toObject() as any;
        if (project.endDate && new Date(project.endDate) > new Date()) {
          project.duration = Math.ceil(
            (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) /
            (1000 * 3600 * 24),
          ) + " day(s)";
        } else {
          project.duration = "No End Date";
          if (project.endDate) project.status = "Inactive";
        }
        return project;
      });

      res.status(200).json({ data: updatedProjects });
    },
  );
  create = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const adminUsername = req.CurrentUser.username.toString();
      const project: Project = await projectSchema.create({
        usernameAdmin: adminUsername,
        ...req.body,
      });
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        project.attachments = results.map((r: CloudinaryUploadResult) => r);
        await project.save()
      }
      project.duration =
        getDaysDifference(new Date(project.startDate), project.endDate)?.toString()! +
        " Days";
      await project.save();

      // Team Flagging Logic: Link admin and members in each other's teamMates list
      const admin = await userSchema.findOne({ username: adminUsername });
      if (admin) {
        if (!admin.teamMates) admin.teamMates = [];

        for (const memberUsername of project.usernameMember) {
          // Add member to admin's team
          if (!admin.teamMates.includes(memberUsername)) {
            admin.teamMates.push(memberUsername);
          }

          // Add admin to member's team
          const member = await userSchema.findOne({ username: memberUsername });
          if (member) {
            if (!member.teamMates) member.teamMates = [];
            if (!member.teamMates.includes(adminUsername)) {
              member.teamMates.push(adminUsername);
              await member.save();
            }
          }
        }
        await admin.save();
      }

      // Notify the members added to this new project
      await notifyProjectMembers(
        project.usernameMember,
        "Project Assigned",
        `You have been added to a new project: ${project.name}`,
        project._id.toString()
      );

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Created Project",
        targetType: "Project",
        targetId: project._id.toString(),
        targetName: project.name,
      });

      res.status(201).json({ data: project });
    },
  );
  deleteOne = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const project = await projectSchema.findById(req.params.id);
      if (!project) {
        return next(new ErrorHandler(404, "Project not found"));
      }

      await taskSchema.deleteMany({ project: req.params.id });
      await projectSchema.findByIdAndDelete(req.params.id);

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Deleted Project",
        targetType: "Project",
        targetId: req.params.id,
        targetName: project.name,
      });

      res.status(200).json({ message: "Project deleted successfully" });
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
      const projectObj = project.toObject() as any;
      projectObj.duration =
        getDaysDifference(new Date(project.startDate), project.endDate)?.toString()! +
        " Days";
      const taskProject = await taskSchema.find({
        project: project._id!.toString(),
      });
      req.projectId = req.params.id;
      // if (!taskProject) {
      //   return next(new Error("Please add tasks to this project"));
      // }
      const member: number = project?.usernameMember.length!;
      // if (!member) {
      //   return next(new Error("Please add members to this project"));
      // }
      const emails: string[] = await Promise.all(project.usernameMember.map(async (username) => {
        const user = await userSchema.findOne({ username: username })
        return user?.email || "";
      }))
      const pending: number = taskProject.filter(
        (t) => t.status === "Pending",
      ).length;
      const Inprogress: number = taskProject.filter(
        (t) => t.status === "In-progress",
      ).length;
      const Reviewing = taskProject.filter((t) => t.status === "Reviewing").length;
      const Accepted = taskProject.filter((t) => t.status === "Accepted").length;
      const Done: number = taskProject.filter(
        (t) => t.status === "Done",
      ).length;
      const percent: number =
        taskProject.length > 0
          ? Math.round((Accepted / taskProject.length) * 100)
          : 0;
      res.status(200).json({
        data: projectObj,
        tasks: taskProject,
        member: member,
        pending: pending,
        Inprogress: Inprogress,
        Reviewing: Reviewing,
        Accepted: Accepted,
        Done: Done,
        percent: percent,
        emails: emails
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
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        if (!project.attachments) project.attachments = [];
        project.attachments.push(...results.map((r: CloudinaryUploadResult) => r));
        await project.save()
      }
      project.duration! =
        getDaysDifference(
          new Date(project.startDate),
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

        // Log Activity
        await ActivityService.log({
          user: req.CurrentUser._id,
          username: req.CurrentUser.username,
          action: "Updated Project",
          targetType: "Project",
          targetId: project._id.toString(),
          targetName: project.name,
        });
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

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Added Member",
        targetType: "Project",
        targetId: project!._id.toString(),
        targetName: project!.name,
        details: { member: usernameMember },
      });

      res
        .status(201)
        .json({ message: "Member added successfully" });
    },
  );
  updateStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { status } = req.body;
      const project: Project | null = await projectSchema.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!project) return next(new Error("Project not found"));

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Changed Status",
        targetType: "Project",
        targetId: project._id.toString(),
        targetName: project.name,
        details: { status },
      });

      res.status(200).json({ data: project });
    }
  );

  getActivities = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const activities = await ActivityService.getByProject(req.params.id);
      res.status(200).json({ data: activities });
    }
  );
  deleteAttachment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const project: Project | null = await projectSchema.findById(req.params.id);
    if (!project) {
      return next(new Error("No project "));
    }
    const attachment = project.attachments?.find((a) => a.public_id === req.params.public_id);
    if (!attachment) {
      return next(new Error("Attachment not found"));
    }
    await cloudinary.uploader.destroy(attachment.public_id)
    project.attachments = project.attachments?.filter((a) => a.public_id !== req.params.public_id);
    await project.save();
    res.status(200).json({ data: project });
  })
  deleteMember = asyncHandler(async(req: Request, res: Response, next: NextFunction) => {
    const project: Project | null = await projectSchema.findById(req.params.id);
    if (!project) {
      return next(new Error("No project "));
    }
    const username = project.usernameMember?.find((a) => a === req.body.usernameMember);
    if (!username) {
      return next(new Error("Member not found"));
    }
    project.usernameMember = project.usernameMember?.filter((a) => a !== req.body.usernameMember);
    await project.save();
    res.status(200).json({ data: project });
  })
}
const projectServices = new ProjectServices();
export default projectServices;
