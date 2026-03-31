import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import { Request, Response, NextFunction } from "express";
import projectSchema from "../Project/project.schema";
import Project from "../Project/project.interface";
import { getDaysDifference, isFutureDate } from "../utils/dateHandler";
import { ErrorHandler } from "../middlewares/errorHandler";
import { createNotification } from "../notification/notification.services";
import ActivityService from "../activity/activity.services";
import { cloudinary, CloudinaryUploadResult, uploadToCloudinary } from "../middlewares/cloudinary";
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
      const tasks: Task[] = await taskSchema.find({ project: req.projectId }).sort({ createdAt: -1 });
      const updatedTasks = tasks.map((t) => {
        const task = t.toObject() as any;
        if (isFutureDate(task.endDate)) {
          task.duration =
            getDaysDifference(
              new Date(Date.now()),
              new Date(task.endDate),
            )?.toString() + " Days" || "0 Days";
        } else {
          task.duration = "0 Days";
        }
        return task;
      });

      res.status(200).json({ data: updatedTasks, NumberofTasks: tasks.length });
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
      const updatedTasks = tasks.map((t) => {
        const task = t.toObject() as any;
        if (isFutureDate(task.endDate)) {
          task.duration =
            getDaysDifference(
              new Date(Date.now()),
              new Date(task.endDate),
            )?.toString() + " Days" || "0 Days";
        } else {
          task.duration = "0 Days";
        }
        return task;
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
      const Reviewing = tasks.filter((t) => t.status === "Reviewing").length;
      const Accepted = tasks.filter((t) => t.status === "Accepted").length;
      const Done: number = tasks.filter((t) => t.status === "Done").length;
      // we can do that in the validation section

      res.status(200).json({
        data: updatedTasks,
        length: tasks.length,
        member: member,
        pending: pending,
        Inprogress: Inprogress,
        Reviewing: Reviewing,
        Accepted: Accepted,
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
        duration: getDaysDifference(new Date(Date.now()), new Date(req.body.endDate))?.toString() + " Days",
        color: req.body.color || "#000000", // default color if not provided
        description: req.body.description,

      });
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        task.attachments = results.map((r: CloudinaryUploadResult) => r);
        await task.save()
      }

      const project: Project | null = await projectSchema.findById({
        _id: task.project._id
      });
      if (!project) {
        return next(new ErrorHandler(404, "project not found"))
      }
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
      const Done: number = tasks.filter((t) => t.status === "Accepted").length;
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
      project.totalTasks++;
      await project?.save()

      // Notify the assigned member
      await createNotification(
        task.usernameMember,
        "Task Assigned",
        `You have been assigned a new task: ${task.name} in project ${project!.name}`,
        task.project._id.toString()
      );

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Created Task",
        targetType: "Task",
        targetId: task._id.toString(),
        targetName: task.name,
        details: { projectId: project!._id.toString() },
      });

      res.status(201).json({ data: task, percent: percent });
    },
  );
  delete = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id.toString());
      if (!task) {
        return next(new Error("No Task "));
      }
      const project: Project | null = await projectSchema.findOne({
        _id: task.project._id
      });
      if (!project) {
        return next(new ErrorHandler(404, "project not found"))
      }
      const tasks: Task[] | null = await taskSchema.find({
        project: task.project._id,
      });
      const Done: number = tasks.filter((t) => t.status === "Accepted").length - (task.status === "Accepted" ? 1 : 0);
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
      if (task.usernameAdmin.toString() !== req.CurrentUser.username.toString()) {
        return next(new ErrorHandler(401, "You aren't authorized to delete this task"));
      }
      project!.totalTasks--;
      await project?.save()
      await taskSchema.findByIdAndDelete(req.params.id);

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Deleted Task",
        targetType: "Task",
        targetId: req.params.id,
        targetName: task.name,
        details: { projectId: project!._id.toString() },
      });

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
      // if (status && req.CurrentUser.role === "admin") {
      //   return next(new Error("Admin cannot update task status ده انت عمدة"));
      // }
      const updatedTask: Task | null = await taskSchema.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true },
      );

      if (!updatedTask) {
        return next(new Error("Task not found"));
      }
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);
        if (!updatedTask!.attachments) updatedTask!.attachments = [];
        updatedTask!.attachments.push(...results.map((r: CloudinaryUploadResult) => r));
        await updatedTask!.save();
      }
      updatedTask.duration! = getDaysDifference(new Date(Date.now()), new Date(updatedTask?.endDate!))?.toString() + " Days" || "0 Days"
      await updatedTask?.save({ validateModifiedOnly: true })

      // Notify the assignee about task update
      await createNotification(
        updatedTask.usernameMember,
        "Task Updated",
        `Task details changed: ${updatedTask.name}`,
        (updatedTask.project as unknown) as string
      );

      // Log Activity
      await ActivityService.log({
        user: req.CurrentUser._id,
        username: req.CurrentUser.username,
        action: "Updated Task",
        targetType: "Task",
        targetId: updatedTask._id.toString(),
        targetName: updatedTask.name,
        details: { projectId: updatedTask.project.toString() },
      });

      res.status(200).json({ data: updatedTask });
    },
  );
  updateStatus = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const task: Task | null = await taskSchema.findById(req.params.id);
      if (!task) {
        return next(new Error("No Task "));
      }
      const requestedStatus: string = req.body.status;
      const isStatusUpdate =
        typeof requestedStatus === "string" && requestedStatus.trim() !== "";
      
      if (req.body.status==="Done"&&req.CurrentUser.role==="member"&&task.memberFiles===false)
       {
  return next(new ErrorHandler(400, "You must upload files when marking task as done"));
}

// Process file uploads regardless of status
if (req.files && (Array.isArray(req.files) ? req.files.length > 0 : Object.keys(req.files).length > 0)) {
  const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
  const uploadPromises = files.map((file: Express.Multer.File) => uploadToCloudinary(file));
  const results = await Promise.all(uploadPromises);
  if (!task.attachments) task.attachments = [];
  task.attachments.push(...results.map((r: CloudinaryUploadResult) => r));
  if(req.CurrentUser.role==="member"){
    task.memberFiles=true;
  }
  if(req.CurrentUser.role==="admin"){
    task.adminFiles=true;
  }
  await task.save();
}
if (
  isStatusUpdate &&
  requestedStatus !== "Pending" &&
  requestedStatus !== "In-progress" &&
  requestedStatus !== "Done" &&
  requestedStatus !== "Reviewing" &&
  requestedStatus !== "Accepted"
) {
  return next(new Error("Invalid status value"));
}

if (
  isStatusUpdate &&
  req.CurrentUser.role === "member" &&
  (requestedStatus === "Reviewing" || requestedStatus === "Accepted")
) {
  return next(
    new ErrorHandler(
      403,
      "Members are not allowed to move tasks to Reviewing or Accepted",
    ),
  );
}
if ((task.status === "Accepted" || task.status === "Reviewing") && req.CurrentUser.role === "member" && req.body.status) {
  return next(new ErrorHandler(403, "You can't move task from Reviewing or Accepted"))
}
const previousStatus = task.status;
const nextStatus: Task["status"] = isStatusUpdate
  ? (requestedStatus as Task["status"])
  : task.status;

// Track review cycles
if (previousStatus === "Reviewing" && nextStatus === "In-progress") {
  task.reviewCycles = (task.reviewCycles || 0) + 1;
}

// Track first time marked as Done
if (nextStatus === "Done" && !task.firstDoneAt) {
  task.firstDoneAt = new Date();
}
await task.save();

if (isStatusUpdate && task.status === nextStatus) {
  res.status(200).json({
    message: `Good! The task is already ${nextStatus}`,
    data: task,
  });
  return;
}
const project: Project | null = await projectSchema.findById({
  _id: task.project._id.toString(),
});
const tasks: Task[] | null = await taskSchema.find({
  project: task.project._id.toString(),
});
const AcceptedCount: number = tasks.filter((t) => {
  if (t._id.toString() === task._id.toString()) {
    return nextStatus === "Accepted";
  }
  return t.status === "Accepted";
}).length;
const percent: number =
  tasks.length > 0 ? Math.round((AcceptedCount / tasks.length) * 100) : 0;
if (project) {
  project.percent = percent;
  if (percent >= 100) {
    project.status = "Done";
  } else {
    project.status = "Active";
  }
  await project.save();
}
let updatedTask: Task | null = task;

// Only update status/note when status is provided
if (isStatusUpdate) {
  const noteToSave =
    nextStatus === "In-progress" &&
      (previousStatus === "Reviewing" || previousStatus === "Accepted")
      ? typeof req.body.note === "string"
        ? req.body.note
        : task.note || ""
      : "";

  updatedTask = await taskSchema.findByIdAndUpdate(
    req.params.id,
    { status: nextStatus, note: noteToSave },
    { new: true },
  );
}

if (updatedTask) {
  if (isStatusUpdate) {
    const message = `Task '${updatedTask.name}' status changed to '${updatedTask.status}'`;
    if (updatedTask.status === "Reviewing") {
      await createNotification(
        updatedTask.usernameMember,
        "Task Under Review",
        `Your task '${updatedTask.name}' is being reviewed at the moment`,
        (updatedTask.project as unknown) as string,
      );
    }

    await createNotification(
      updatedTask.usernameAdmin,
      "Task Status Updated",
      message,
      (updatedTask.project as unknown) as string,
    );
    if (updatedTask.usernameMember !== updatedTask.usernameAdmin) {
      await createNotification(
        updatedTask.usernameMember,
        "Task Status Updated",
        message,
        (updatedTask.project as unknown) as string,
      );
    }

    await ActivityService.log({
      user: req.CurrentUser._id,
      username: req.CurrentUser.username,
      action: "Changed Status",
      targetType: "Task",
      targetId: updatedTask._id.toString(),
      targetName: updatedTask.name,
      details: {
        status: updatedTask.status,
        projectId: updatedTask.project.toString(),
      },
    });
  }
}

res.status(200).json({ data: updatedTask, percent: percent });
    },
  );
getOne = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const task: Task | null = await taskSchema.findById(req.params.id);
  if (!task) {
    return next(new Error("No Task "));
  }
  res.status(200).json({ data: task });
})
deleteAttachment = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const task: Task | null = await taskSchema.findById(req.params.id);
  if (!task) {
    return next(new Error("No Task "));
  }
  const attachment = task.attachments?.find((a) => a.public_id === req.params.public_id);
  if (!attachment) {
    return next(new Error("Attachment not found"));
  }
  await cloudinary.uploader.destroy(attachment.public_id)
  task.attachments = task.attachments?.filter((a) => a.public_id !== req.params.public_id);
  await task.save();
  res.status(200).json({ data: task });
})
}

const taskServices = new TaskServices();
export default taskServices;
