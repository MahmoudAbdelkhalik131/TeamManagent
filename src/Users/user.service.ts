import asyncHandler from "express-async-handler";
import userSchema from "./user.schema";
import Users from "./user.interface";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import Token from "../middlewares/Tokens";
import MESSAGES from "../utils/messages";

class UserService {
  login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { username, password } = req.body;
      // ensure password field is selected explicitly (schema should use select:false)
      const user: Users | null = await userSchema
        .findOne({ username: username })
        .select("+password");
      if (!user) {
        // generic message to avoid user enumeration
        return next(new Error(MESSAGES.INVALID_CREDENTIALS));
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return next(new Error(MESSAGES.INVALID_CREDENTIALS));
      }
      const token = Token.createToken(user);
      res.status(200).json({
        data: {
          username: user.username,
          userRole: user.role,
          UserId: user.id,
          token: token,
        },
        message: "User logged in",
      });
    }
  );
  register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const hashed = await bcrypt.hash(req.body.password, 10);
      const newUser: Users = await userSchema.create({
        username: req.body.username,
        password: hashed,
        role: req.body.role,
      });
      await newUser.save();
      res.status(201).json({
        data: { username: newUser.username, id: newUser.id },
        message: MESSAGES.CREATED,
      });
    }
  );
}
const userService = new UserService();
export default userService;
