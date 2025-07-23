import { body, param } from "express-validator";
import projectSchema from "./project.schema";
import validatorMiddleware from "../middlewares/validation.middleware";

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
      .optional()
      .isEmpty()
      .withMessage("this field cann't be Empty"),
    body("duration")
      .optional()
      .isEmpty()
      .withMessage("this field cann't be Empty"),
    validatorMiddleware,
  ];
  getone = [
    param("id").isMongoId().withMessage("Invaild Id"),
    validatorMiddleware,
  ];
  deleteOne = [
    param("id").isMongoId().withMessage("Invaild Id"),
    validatorMiddleware,
  ];
  create=[
    body('name').notEmpty().withMessage("this field is required").custom(async(val)=>{
        const project= await projectSchema.findOne({name:val})
        if(project) throw new Error("this Project Exits already")
        return true
    }),
    body('color').notEmpty().withMessage("this field cann't be Empty"),
    body('duration').notEmpty().withMessage("this field cann't be Empty"),
    validatorMiddleware
    ]
}
const projectValidation = new ProjectValidation()
export default projectValidation