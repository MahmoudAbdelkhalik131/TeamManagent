import { Router } from "express";
const profileRouter = Router();
import profileServices from "./profile.sevices";
import auth from "../auth/auth.middleware";
import profileValidation from "./profile.validation";
profileRouter
  .route("/")
  .get(auth.verifyToken, profileServices.getProfile)
  .put(
    auth.verifyToken,
    profileValidation.updateProfileValidation,
    profileServices.updateProfile,
  )
  .delete(auth.verifyToken, profileServices.DeleteProfile);
export default profileRouter;
