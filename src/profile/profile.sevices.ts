import AsyncHandler from "express-async-handler";
import userSchema from "../Users/user.schema";
import Users from "../Users/user.interface";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../middlewares/errorHandler";
import { cloudinary, uploadToCloudinary } from "../middlewares/cloudinary";

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

  // ── Upload / replace profile picture ──────────────────────────────────────
  uploadAvatar = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        return next(new ErrorHandler(400, "Please provide an image file"));
      }

      // Validate it's an image
      if (!req.file.mimetype.startsWith("image/")) {
        return next(new ErrorHandler(400, "Only image files are allowed for avatars"));
      }

      const user = await userSchema.findById(req.CurrentUser._id);
      if (!user) {
        return next(new ErrorHandler(404, "User not found"));
      }

      // Delete old avatar from Cloudinary before uploading the new one
      if (user.avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId, {
          resource_type: "image",
        });
      }

      // Upload new avatar to Cloudinary (memory → stream → cloud, no disk)
      const result = await uploadToCloudinary(req.file);

      // Persist Cloudinary URL + public_id to the user document
      user.avatar = result.secure_url;
      user.avatarPublicId = result.public_id;
      await user.save({ validateModifiedOnly: true });

      res.status(200).json({
        message: "Avatar updated successfully",
        avatar: result.secure_url,
      });
    },
  );
}
const profileServices = new ProfileServices();
export default profileServices;
