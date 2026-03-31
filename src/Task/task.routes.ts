import { Router } from "express";
const taskRouter = Router({ mergeParams: true });
import auth from "../auth/auth.middleware";
import taskServices from "./task.services";
import taskValidation from "./task.validation";
import { uploadMultiple } from "../middlewares/uploadMiddleware";

taskRouter.get(
  "/all",
  auth.verifyToken,
  taskValidation.setId,
  taskServices.setId,
  taskServices.getAll
);
taskRouter.post(
  "/",
  auth.allowedRoles(["admin"]),
  taskServices.setId,
  uploadMultiple,
  taskValidation.create,
  taskServices.create
);
taskRouter
  .route("/")
  .get(
    auth.verifyToken,
    taskValidation.setId,
    taskServices.setId,
    taskValidation.getAllProjectTask,
    taskServices.getProjectTask
  );
taskRouter
  .route("/utask")
  .get(
    auth.allowedRoles(["member", "admin"]),
    taskValidation.getAlluserTask,
    taskServices.getUserTasks
  );
taskRouter
  .route("/:id")
  .delete(
    auth.allowedRoles(["admin"]),
    taskValidation.delete,
    taskServices.delete
  )
taskRouter
  .route("/:id")
  .patch(
    auth.allowedRoles(["member", "admin"]),
    uploadMultiple,
    taskServices.updateStatus
  )
  .put(
    auth.allowedRoles(["admin"]),
    uploadMultiple,
    taskValidation.update,
    taskServices.updateTask
  )
  .get(
    auth.verifyToken,
    taskValidation.setId,
    taskServices.setId,
    taskServices.getOne
  )
taskRouter.delete(
  "/:id/att/:public_id",
  auth.allowedRoles(["admin", "member"]),
  taskServices.deleteAttachment
)

export default taskRouter;
