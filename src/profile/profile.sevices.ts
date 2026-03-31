import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Users from "../Users/user.interface";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../middlewares/errorHandler";
class ProfileServices {
  gettAllUser = async (req: Request, res: Response, next: NextFunction) => {
    const users: Users[] | null = await userSchema.find();
    res.status(200).json({ data: users });
  };
  getProfile = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.CurrentUser) {
        const user: Users | null = await userSchema.findById({
          _id: req.CurrentUser._id.toString(),
        }).select("-password -verifyCode -forgetPasswordCode");
        res.status(200).json({ data: user });
      } else {
        return next(new ErrorHandler(401, "Please Login first"));
      }
    },
  );
  updateProfile = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user: Users | null = await userSchema.findByIdAndUpdate(
        { _id: req.CurrentUser._id.toString() },
        {
          email: req.body.email,
        },
      );
      res.status(200).json({ data: user });
    },
  );
  DeleteProfile = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.CurrentUser) {
        await userSchema.findByIdAndDelete({
          _id: req.CurrentUser._id.toString(),
        });
        res.status(200).json({ message: "Profile Deleted" });
      } else {
        return next(new ErrorHandler(401, "Please Login first"));
      }
    },
  );
}
const profileServices = new ProfileServices();
export default profileServices;
