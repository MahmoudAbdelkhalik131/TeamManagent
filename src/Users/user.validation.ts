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
      body("email")
      .isEmail()
      .withMessage("email is required")
      .custom(async (val, { req }) => {
        const user: Users | null = await userSchema.findOne({
          email: val,
        });
        if (user) {
          throw new Error("email already exists");
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
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .custom(async (val, { req }) => {
        const user: Users | null = await userSchema.findOne({ email: val });
        console.log(user)
        if (!user || user.validUser==false) {
          await userSchema.deleteOne({email:val})
          throw new Error("User not found please register first.....");
        }
        const isPasswordCorrect =  await bcrypt.compare(
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
/**
 import { body } from "express-validator";
import validatorMiddleware from "../middleware/validation";
import userSchema from "./user.schema";
import User from "./user.interface";
class Validation {
  login = [
    body("email").isEmail().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validatorMiddleware,
  ];
  register = [
    body("username")
      .notEmpty()
      .withMessage("username is required")
      .custom(async (val, { req }) => {
        const user: User | null = await userSchema.findOne({
          username:val
        });
        if (user) {
          throw new Error("Username already exists");
        }
        return true;
      }),
    body("email")
      .isEmail()
      .withMessage("email is required")
      .custom(async (val, { req }) => {
        const user: User | null = await userSchema.findOne({
          email: val,
        });
        if (user) {
          throw new Error("email already exists");
        }
        return true;
      }),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .custom(async (val, { req }) => {
        const confirmPassword: string=req.body.confirmPassword;;
        if (confirmPassword !== val) {
          throw new Error("Password does not match");
        }
        return true;
      }),
    validatorMiddleware,
  ];
}
const Uservalidation = new Validation()
export default Uservalidation;
 */