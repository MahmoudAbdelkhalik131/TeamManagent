import { body, param } from "express-validator";
import projectSchema from "./project.schema";
import validatorMiddleware from "../middlewares/validation.middleware";
import Project from "./project.interface";

class ProjectValidation {
  updateOne = [
    param("id").isMongoId().withMessage("Invaild Id"),
    body("name")
      .optional()
      .custom(async (val) => {
        const project = await projectSchema.findOne({ name: val });
        if (project) throw new Error("this Project Exits already");
      }),
    body("color")
      .optional(),
    body("duration")
      .optional(),
    validatorMiddleware,
  ];
  getone = [
    param("id")
      .notEmpty()
      .isMongoId()
      .withMessage("Invaild Id")
      .custom(async (val, { req }) => {
        const project: Project | null = await projectSchema.findById(val);
        if (!project) {
          return new Error("There NO PROJECT");
        }
        return true;
      }),
    validatorMiddleware,
  ];
  deleteOne = [
    param("id").isMongoId().withMessage("Invaild Id").custom(async(val,{req})=>{
        const project:Project|null=await projectSchema.findById({_id:val})
        if(!project){
           return new Error("Project Not Found")
        }
        if(project.usernameAdmin!==req.CurrentUser.username||project.usernameMember!==req.CurrentUser.username){
             return new Error ("You aren't authorized to delete this project ")
        }
    }),
    validatorMiddleware,
  ];
  create = [
    body("name")
      .notEmpty()
      .withMessage("this field is required")
      .custom(async (val) => {
        const project = await projectSchema.findOne({ name: val });
        if (project) throw new Error("this Project Exits already");
        return true;
      }),
    body("color").notEmpty().withMessage("this field cann't be Empty"),
    body("duration").notEmpty().withMessage("this field cann't be Empty"),
    validatorMiddleware,
  ];
}
const projectValidation = new ProjectValidation();
export default projectValidation;
