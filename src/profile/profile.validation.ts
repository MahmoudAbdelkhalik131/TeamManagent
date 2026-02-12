import validatorMiddleware from "../middlewares/validation.middleware";
import { body } from "express-validator";
import userSchema from "../Users/user.schema";

class ProfileValidation {
  updateProfileValidation = [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format")
      .custom(async (val, { req }) => {
        const user = await userSchema.findOne({ email: val.toString() });
        if (user && user._id.toString() !== req.user._id.toString()) {
          throw new Error("Email already exists");
        }
        return true;
      }),
    validatorMiddleware,
  ];
}
const profileValidation = new ProfileValidation();
export default profileValidation;
