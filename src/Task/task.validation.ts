import { body, param } from "express-validator";
import Users from "../Users/user.interface";
import userSchema from "../Users/user.schema";
import Project from "../Project/project.interface";
import projectSchema from "../Project/project.schema";
import validatorMiddleware from "../middlewares/validation.middleware";
import Task from "./task.interface";
import taskSchema from "./task.schema";
class TaskValidation {
  create = [
    body("color")
      .optional()
      .notEmpty()
      .withMessage("fill it or it will take the default"),
    body("duration")
      .notEmpty()
      .withMessage("You need to determin the duration for task"),
    body("description")
      .notEmpty()
      .withMessage("Please set the description for the task"),
      body('username').notEmpty()
      .custom(async ( val,{ req }) => {
        
        const user: Users | null = await userSchema.findOne({
          username: val.toString(),
        });
        if (!user) {
          return new Error("Please Log In");
        }
        return true;
      }),
      body('project').custom(async(val,{req})=>{
         const project: Project | null = await projectSchema.findById(
          req.projectId
        );
        if (!project) {
          return new Error("Select the project First");
        }
      }),
    validatorMiddleware,
  ];
  getAlluserTask = [
    body("username").custom(async (val,{ req }) => {
      const user: Users | null = await userSchema.findOne({
        username: val.toString(),
      });
      if (!user) {
        return new Error("Please Log In");
      }
      return true;
    }),
    validatorMiddleware,
  ];
  getAllProjectTask = [
    body("project").custom(async (val,{ req }) => {
      const project: Project | null = await projectSchema.findById(
         val.toString()
      );
      if (!project) {
        return new Error("Select the project First");
      }
      return true;
    }),
    validatorMiddleware,
  ];
  delete = [
    param("id")
      .notEmpty()
      .withMessage("Please inter the task Id")
      .custom(async (val,{ req }) => {
        const task: Task | null = await taskSchema.findById( val.toString());
        if (!task) {
          return new Error("Please Enter a valid Task");
        }
      }),
  ];
  update = [
    body("color")
      .optional()
      .notEmpty()
      .withMessage("fill it or it will take the default"),
    body("duration")
      .optional()
      .notEmpty()
      .withMessage("You need to determin the duration for task"),
    body("description")
      .optional()
      .notEmpty()
      .withMessage("Please set the description for the task"),
    body("project")
      .optional()
      .notEmpty()
      .custom(async (val) => {
        const project: Project | null = await projectSchema.findById( val.toString());
        if (!project) {
          return new Error("Select the project First");
        }
        return true;
      }),
    body("username")
      .optional()
      .notEmpty()
      .custom(async (val,{ req }) => {
        const user: Users | null = await userSchema.findOne({
          username:  val.toString(),
        });
        if (!user) {
          return new Error("Please Log In");
        }
        return true;
      }),
    validatorMiddleware,
  ];
}
const taskValidation=new TaskValidation()
export default taskValidation
