import { Router } from "express";
const taskRouter = Router()
import auth from "../auth/auth.middleware"
import taskServices from "./task.services";
import taskValidation from "./task.validation";
taskRouter.route('/')
.get(auth.verifyToken,taskServices.getAll)
taskRouter.post('/create',auth.allowedRoles(['admin']),taskValidation.create,taskServices.create)
taskRouter.route('/ptask')
.get(auth.verifyToken,taskValidation.getAllProjectTask,taskServices.getProjectTask)
taskRouter.route('/utask')
.get(auth.verifyToken,taskValidation.getAlluserTask,taskServices.getUserTasks)
taskRouter.route('/:id')
.delete(auth.allowedRoles(['admin']),taskValidation.delete,taskServices.delete)
.put(auth.allowedRoles(['admin']),taskValidation.update,taskServices.updateTask)
export default taskRouter