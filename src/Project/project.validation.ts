import { body, param } from "express-validator";
import projectSchema from "./project.schema";
import validatorMiddleware from "../middlewares/validation.middleware";
import Project from "./project.interface";
import userSchema from "../Users/user.schema";
import { parseDate } from "../utils/dateHandler";

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
      .optional()
      .custom((val) => {
        if (!val) return true;
        const date = parseDate(val);
        if (!date) {
          throw new Error("Invalid date format. Use ISO format: YYYY-MM-DD or 2024-12-31T10:30:00Z");
        }
        return true;
      }),
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
          throw new Error("There NO PROJECT");
        }
        return true;
      }),
    validatorMiddleware,
  ];
  deleteOne = [
    param("id").isMongoId().withMessage("Invaild Id").custom(async(val,{req})=>{
        const project:Project|null=await projectSchema.findById({_id:val})
        if(!project){
           throw new Error("Project Not Found")
        }
        if(project.usernameAdmin.toString()!==req.CurrentUser.username.toString()){
             throw new Error ("You aren't authorized to delete this project ")
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
      body("usernameMember")
      .notEmpty()
      .withMessage("this field is required")
      .custom(async (val) => {
        if(Array.isArray(val)){
           val.forEach(async(username:string)=>{
          const userExits= await userSchema.findOne({username:username})
          if(!userExits){
           throw new Error(`User ${username} not found`);
          }
          if(userExits.role ==="admin"){
            throw new Error(`Admin User ${username} cannot be added to the project as a member`);
          }
        })
        }
        else{
          const userExits= await userSchema.findOne({username:val.toString()})
          if(!userExits){
           throw new Error(`User ${val} not found`);
          }
        }
        return true;
      }),
    body("color").notEmpty().withMessage("this field cann't be Empty"),
    body("duration")
      .notEmpty()
      .withMessage("this field cann't be Empty")
      .custom((val) => {
        const date = parseDate(val);
        if (!date) {
          throw new Error("Invalid date format. Use ISO format: YYYY-MM-DD or 2024-12-31T10:30:00Z");
        }
        return true;
      }),
     body("description").notEmpty().withMessage("this field cann't be Empty"),
    validatorMiddleware,
  ];
  AddUser = [
    body("usernameMember")
      .notEmpty()
      .withMessage("this field is required")
      .custom(async (val,{req}) => {
       const userExits= await userSchema.findOne({username:val.toString()})
       if(!userExits){
        throw new Error("User not found");
       }
       console.log(userExits.role);
      if(userExits.role ==="admin"){
        throw new Error("Admin User cannot be added to the project as a member");
      }
        return true;
      }),
       param("id").isMongoId().withMessage("Invaild Id").custom(async(val,{req})=>{
        const project:Project|null=await projectSchema.findById({_id:val.toString()})
        if(!project){
           throw new Error("Project Not Found")
        }
        if(project.usernameMember.includes(req.body.usernameMember)){
          throw new Error ("User is already a member of the project");
        }
    }),
    validatorMiddleware,
  ];
}
const projectValidation = new ProjectValidation();
export default projectValidation;
