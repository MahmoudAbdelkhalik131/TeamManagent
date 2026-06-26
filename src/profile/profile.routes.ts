import { Router } from "express";
const profileRouter = Router();
import profileServices from "./profile.sevices";
import auth from "../auth/auth.middleware";
import profileValidation from "./profile.validation";
import { uploadSingleImage } from "../middlewares/uploadMiddleware";

profileRouter
  .route("/")
  .get(auth.verifyToken, profileServices.getProfile)
  .put(
    auth.verifyToken,
    profileValidation.updateProfileValidation,
    profileServices.updateProfile,
  )
  .delete(auth.verifyToken, profileServices.DeleteProfile);

// PUT /api/profile/avatar  — upload / replace profile picture → Cloudinary
profileRouter.put(
  "/avatar",
  auth.verifyToken,
  uploadSingleImage,
  profileServices.uploadAvatar,
);

export default profileRouter;
