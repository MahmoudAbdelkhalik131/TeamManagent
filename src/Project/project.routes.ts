import { Router } from "express";
import projectServices from "./project.services";
import projectValidation from "./project.validation";
export const projectRouter: Router = Router();
projectRouter.route("/")
.get(projectServices.getAll)
.post(projectValidation.create,projectServices.create)
projectRouter.route('/:id')
.get(projectValidation.getone,projectServices.getOne)
.put(projectValidation.updateOne,projectServices.updateOne)
.delete(projectValidation.deleteOne,projectServices.deleteOne)
export default projectRouter;