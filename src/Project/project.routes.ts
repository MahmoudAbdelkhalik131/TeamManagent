import { Router } from "express";
import projectServices from "./project.services";
import projectValidation from "./project.validation";
import auth from "../auth/auth.middleware";
import taskRouter from "../Task/task.routes";
import { uploadMultiple } from "../middlewares/uploadMiddleware";

export const projectRouter: Router = Router({});
projectRouter.use("/:projectId/task", taskRouter);
projectRouter.post(
  "/",
  auth.allowedRoles(["admin"]),
uploadMultiple,
  projectValidation.create,
  projectServices.create,
);
projectRouter.route("/").get(auth.verifyToken, projectServices.getAll);
projectRouter
  .route("/:id")
  .get(auth.verifyToken, projectValidation.getone, projectServices.getOne)
  .put(
    auth.allowedRoles(["admin"]),
    uploadMultiple,
    projectValidation.updateOne,
    projectServices.updateOne,
  )
  .delete(
    auth.allowedRoles(["admin"]),
    projectValidation.deleteOne,
    projectServices.deleteOne,
  );

projectRouter.post(
  "/:id/members",
  auth.allowedRoles(["admin"]),
  projectValidation.AddUser,
  projectServices.AddUser,
);

projectRouter.patch(
  "/:id/status",
  auth.allowedRoles(["admin"]),
  projectServices.updateStatus,
);

projectRouter.get(
  "/:id/activities",
  auth.verifyToken,
  projectServices.getActivities,
);

projectRouter.delete(
  "/:id/att/:public_id",
  auth.allowedRoles(["admin"]),
  projectServices.deleteAttachment,
);

export default projectRouter;
