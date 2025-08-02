import { body } from "express-validator";
import userSchema from "./user.schema";
import Users from "./user.interface";
import validatorMiddleware from "../middlewares/validation.middleware";
import bcrypt from "bcrypt";
class UserValidation {
  register = [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .custom(async (val, { req }) => {
        const user: Users | null = await userSchema.findOne({ username: val });
        if (user) {
          throw new Error("Username already exists");
        }
        return true;
      }),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .custom((val, { req }) => {
        if (val.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }
        const confirmPassword = req.body.confirmPassword;
        if (val !== confirmPassword) {
          throw new Error("Password and Confirm Password do not match");
        }
        return true;
      }),
    validatorMiddleware,
  ];
  login = [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .custom(async (val, { req }) => {
        const user: Users | null = await userSchema.findOne({ username: val });
        if (!user) {
          throw new Error("User not found please register first.....");
        }
        const isPasswordCorrect = bcrypt.compareSync(
          req.body.password,
          user.password
        );
        if (!isPasswordCorrect) {
          throw new Error("Invalid Username or Password");
        }
        return true;
      }),
    body("password").notEmpty().withMessage("Password is required"),
    validatorMiddleware,
  ];
}
const userValidation = new UserValidation();
export default userValidation;
