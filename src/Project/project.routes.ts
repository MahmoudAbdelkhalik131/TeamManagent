import { Router } from "express";
import projectServices from "./project.services";
import projectValidation from "./project.validation";
import auth from "../auth/auth.middleware";
export const projectRouter: Router = Router();
projectRouter.post('/create',auth.allowedRoles(['admin']),projectValidation.create,projectServices.create)
projectRouter.route("/")
.get(projectServices.getAll)
projectRouter.route('/:id')
.get(projectValidation.getone,projectServices.getOne)
.put(projectValidation.updateOne,projectServices.updateOne)
.delete(projectValidation.deleteOne,projectServices.deleteOne)
export default projectRouter;