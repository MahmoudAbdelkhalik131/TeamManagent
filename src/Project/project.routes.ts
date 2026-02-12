import { Router } from "express";
import projectServices from "./project.services";
import projectValidation from "./project.validation";
import auth from "../auth/auth.middleware";
import taskRouter from "../Task/task.routes";
export const projectRouter: Router = Router({});
projectRouter.use("/:projectId/task", taskRouter);
projectRouter.post(
  "/create",
  auth.allowedRoles(["admin"]),
  projectValidation.create,
  projectServices.create,
);
projectRouter.route("/").get(auth.verifyToken, projectServices.getAll);
projectRouter
  .route("/:id")
  .get(auth.verifyToken, projectValidation.getone, projectServices.getOne)
  .put(
    auth.allowedRoles(["admin"]),
    projectValidation.updateOne,
    projectServices.updateOne,
  )
  .post(
    auth.allowedRoles(["admin"]),
    projectValidation.AddUser,
    projectServices.AddUser,
  )
  .delete(
    auth.allowedRoles(["admin"]),
    projectValidation.deleteOne,
    projectServices.deleteOne,
  );

export default projectRouter;
