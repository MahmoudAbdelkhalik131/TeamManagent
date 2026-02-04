import { Router } from "express";
import userValidation from "./user.validation";
import userService from "./user.service";
import RateLimiter from "../middlewares/ratelimiter"
import auth from "../auth/auth.middleware";
const UserRouter = Router();

UserRouter.get('/',auth.allowedRoles(['admin']),userService.gettAllUser)
UserRouter.post('/login',userValidation.login,userService.login)
UserRouter.post('/register',userValidation.register,userService.register)
UserRouter.post('/verify',userService.verifyCode)
UserRouter.post('/password-reset-code',userService.ResetPasswordCode)
UserRouter.post('/verify-reset-code',userService.verifyCodeForgetPasswordCode)
UserRouter.post('/reset-password',userValidation.ChangePassword,userService.resetPassword)

export default UserRouter;

/*
import Uservalidation from './user.validation'
import auth from '../auth/authen'
const userRouter = express.Router()
userRouter.get('/',auth.allowedRoles(['admin']),userSevices.gettAllUser)
userRouter.post('/login',Uservalidation.login,userSevices.login)
userRouter.post('/register',Uservalidation.register,userSevices.register)
userRouter.post('/verify',userSevices.verifyCode)
userRouter.post('/password-reset-code',userSevices.ResetPasswordCode)
userRouter.post('/verify-reset-code',userSevices.verifyCodeForgetPasswordCode)
userRouter.post('/reset-password',userSevices.resetPassword)
export default userRouter


*/ 