import { body, param } from "express-validator";
import Users from "../Users/user.interface";
import userSchema from "../Users/user.schema";
import Project from "../Project/project.interface";
import projectSchema from "../Project/project.schema";
import validatorMiddleware from "../middlewares/validation.middleware";
import Task from "./task.interface";
import taskSchema from "./task.schema";
import {
  parseDate,
  isValidDate,
  isFutureDate,
  getDaysDifference,
} from "../utils/dateHandler";
class TaskValidation {
  create = [
    body("color")
      .optional()
      .notEmpty()
      .withMessage("fill it or it will take the default"),
    body("endDate")
      .notEmpty()
      .withMessage("You need to determine the end date for task")
      .custom((val) => {
        const date = parseDate(val);
        if (!date) {
          throw new Error(
            "Invalid date format. Use ISO format: YYYY-MM-DD or 2024-12-31T10:30:00Z",
          );
        }
        // التحقق من أن التاريخ في المستقبل (اختياري - حسب احتياجاتك)
        if (!isFutureDate(date)) {
          throw new Error("Task duration must be in the future");
        }
        return true;
      }),
    body("description")
      .notEmpty()
      .withMessage("Please set the description for the task"),
    body("username")
      .notEmpty()
      .custom(async (val, { req }) => {
        // console.log(val)
        const user: Users | null = await userSchema.findOne({
          username: val.toString(),
        });
        if (user === null) {
          throw new Error("Member username not found");
        }
        if (user.role === "admin") {
          throw new Error("Admin cannot have tasks ده انت عمدة");
        }

        return true;
      }),
    param("projectId").custom(async (val, { req }) => {
      const project: Project | null = await projectSchema.findById({
        _id: val.toString(),
      });
      if (!project) {
        throw new Error("Select the project First");
      }
      if (
        req.body.endDate &&
        new Date(project.endDate) <= new Date(req.body.endDate)
      ) {
        throw new Error("Task end date cannot be after project end date");
      }
      console.log(`1`);
      if (
        project.usernameAdmin.toString() !== req.CurrentUser.username.toString()
      ) {
        throw new Error("You aren't authorized to add tasks to this project");
      }
      if (!project.usernameMember.includes(req.body.username)) {
        throw new Error(
          "You aren't authorized to add tasks member to this project",
        );
      }
      return true;
    }),
    validatorMiddleware,
  ];
  getAlluserTask = [
    body("username").custom(async (val, { req }) => {
      const user: Users | null = await userSchema.findOne({
        username: req.CurrentUser.username,
      });
      if (!user) {
        throw new Error("Please Log In");
      }
      return true;
    }),
    validatorMiddleware,
  ];
  getAllProjectTask = [
    param("projectId")
      .isMongoId()
      .withMessage("Invalid Project Id")
      .custom(async (val, { req }) => {
        const task: Task | null = await taskSchema.findOne({
          project: val,
        });
        if (!task) {
          throw new Error("OOOops! please add tasks to this project first");
        }
        return true;
      }),
    validatorMiddleware,
  ];
  delete = [
    param("id")
      .notEmpty()
      .withMessage("Please inter the task Id")
      .custom(async (val, { req }) => {
        const task: Task | null = await taskSchema.findById(val.toString());
        if (!task) {
          throw new Error("Please Enter a valid Task");
        }
        if (
          task.usernameAdmin.toString() !== req.CurrentUser.username.toString()
        ) {
          throw new Error("You aren't authorized to delete tasks from project");
        }

        return true;
      }),
  ];
  update = [
    body("color")
      .optional()
      .notEmpty()
      .withMessage("fill it or it will take the default"),
    body("endDate")
      .optional()
      .custom(async (val, { req }) => {
        if (!val) return true;
        const date = parseDate(val);
        if (!date) {
          throw new Error(
            "Invalid date format. Use ISO format: YYYY-MM-DD or 2024-12-31T10:30:00Z",
          );
          if (req.params!.id) {
            const task: Task | null = await taskSchema.findById({
              _id: req.params!.id,
            });
            if (task) {
              task?.duration !=
                getDaysDifference(new Date(Date.now()), date!)?.toString() +
                  " Days" || "0 Days";
              await task!.save();
            }
          }
        }
        return true;
      }),
    body("duration").custom(async (val, { req }) => {
      if (val) {
        throw new Error(
          "Duration field is not allowed, it will be calculated automatically based on the end date",
        );
      }
      return true;
    }),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Please set the description for the task"),
    body("project")
      .optional()
      .notEmpty()
      .custom(async (val, { req }) => {
        const project: Project | null = await projectSchema.findById(
          val.toString(),
        );
        if (!project) {
          throw new Error("Select the project First");
        }
        if (
          req.body.endDate &&
          new Date(project.endDate) <= new Date(req.body.endDate)
        ) {
          throw new Error("Task end date cannot be after project end date");
        }
        if (
          project.usernameAdmin.toString() !==
          req.CurrentUser.username.toString()
        ) {
          throw new Error("You aren't authorized to add tasks to this project");
        }
        if (!project.usernameMember.includes(req.body.username.toString())) {
          throw new Error("You aren't authorized to add tasks to this project");
        }
        return true;
      }),
    body("username")
      .optional()
      .notEmpty()
      .custom(async (val, { req }) => {
        const user: Users | null = await userSchema.findOne({
          username: val.toString(),
        });
        if (!user) {
          throw new Error("user not found");
        }
        return true;
      }),
    validatorMiddleware,
  ];
  setId = [
    param("projectId")
      .isMongoId()
      .withMessage("Invalid Id")
      .notEmpty()
      .withMessage("please inter the project Id")
      .custom(async (val, { req }) => {
        const project: Project | null = await projectSchema.findById(
          val.toString(),
        );
        if (!project) {
          throw new Error("Please Enter valid Project Id");
        }
        return true;
      }),
  ];
}
const taskValidation = new TaskValidation();
export default taskValidation;
