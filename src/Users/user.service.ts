import AsyncHandler from "express-async-handler";
import userSchema from "./user.schema";
import Users from "./user.interface";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import Token from "../middlewares/Tokens";
import { ErrorHandler } from "../middlewares/errorHandler";
import sendEmail from "../utils/sendEmail";


class UserServices {
  gettAllUser = async (req: Request, res: Response, next: NextFunction) => {
    const users: Users[] | null = await userSchema.find().select("-password -verifyCode -forgetPasswordCode");
    res.status(200).json({ data: users });
  };
  login = async (req: Request, res: Response, next: NextFunction) => {
    const user: Users | null = await userSchema.findOne({
      email: req.body.email,
    });
    if (!user) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }
    const token = Token.createToken(user);
    const { password, verifyCode, forgetPasswordCode, ...safeUser } = user.toObject();
    res.status(200).json({ data: safeUser, token: token });
  };
  register = async (req: Request, res: Response, next: NextFunction) => {
    const verifyCode =  Math.floor(100000 + Math.random() * 900000).toString();
     const user = {
      username: req.body.username,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      role: req.body.role || "member",
      verifyCode: verifyCode,
    };
    await sendEmail({
      verifyCode: verifyCode,
      subject: "You verification code is ",
      email: user.email.toString(),
    }); 
    const token = Token.createToken(user);
    res.status(200).json({
      token: token,
      message: "verification code sent successfully Please check your email",
    });
  };
  verifyCode = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
          return next(new ErrorHandler(401, `${req.__("check_active")}`));
        }
        const decode: any = Token.verifyToken(token);
        if(!decode) {
          return next(new ErrorHandler(401, `${req.__("check_active")}`));
        }
        if (!decode.user) {
          return next(new ErrorHandler(400, `${req.__("allowed_to")}`));
        }
        if (req.body.verifyCode !== decode.user.verifyCode) {
          return next(new ErrorHandler(400, `${req.__("check_code_valid")}`));
        }
         const userCreated = await userSchema.create({
          username: decode.user.username,
          email: decode.user.email,
          password: decode.user.password,
          role: decode.user.role || "member",
          verifyCode: decode.user.verifyCode,
          validUser: false
         })
         userCreated.validUser = true;
         userCreated.verifyCode = await bcrypt.hash(userCreated.verifyCode, 10);
         await userCreated.save();
        res.status(200).json({ message: "You have registared successfully" });
      } else {
        return next(new ErrorHandler(404, `${req.__("check_login")}`));
      }
    },
  );
  // Still under Development
  ResetPasswordCode = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      const user: Users | null = await userSchema.findOne({
        email: req.body.email,
      });
      if (!user) {
        return next(new ErrorHandler(404, "You are not exist"));
      }
      await sendEmail({
        verifyCode: verifyCode,
        subject: "You reset code is ",
        email: user.email.toString(),
      });
      user.forgetPasswordCode = await bcrypt.hash(verifyCode, 10);
      await user.save();
      const token = Token.createTokenCode(user);
      res
        .status(200)
        .json({ message: "The code send succefully", token: token });
    },
  );
  verifyCodeForgetPasswordCode = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new ErrorHandler(401, `${req.__("check_active")}`));
        }
        const decode: any = Token.verifyTokenCode(token);
        const user = await userSchema.findById(decode.user._id.toString());
        if (!user) {
          return next(new ErrorHandler(400, `${req.__("allowed_to")}`));
        }
        const Isvalid = await bcrypt.compare(
          req.body.verifyCode,
          user.forgetPasswordCode,
        );
        if (Isvalid === false) {
          return next(new ErrorHandler(400, "Invalid Code"));
        }
        res.status(200).json({ message: "Code Verified successfully" });
      } else {
        return next(new ErrorHandler(404, `${req.__("check_reset_code")}`));
      }
    },
  );
  resetPassword = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (req.headers.authorization) {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new ErrorHandler(401, `${req.__("check_active")}`));
        }
        const decode: any = Token.verifyTokenCode(token);
        const user = await userSchema.findById(decode.user._id.toString());
        if (!user) {
          return next(new ErrorHandler(400, `${req.__("allowed_to")}`));
        }
        user.password = await bcrypt.hash(req.body.password, 10);
        user.forgetPasswordCode = "";
        await user.save();
        res.status(200).json({ message: "Password Reset Successfully" });
      } else {
        return next(new ErrorHandler(404, `${req.__("check_reset_code")}`));
      }
    },
  );
  getMyTeam = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const users: Users[] | null = await userSchema.find({
        username: { $in: req.CurrentUser.teamMates || [] }
      }).select("-password -verifyCode -forgetPasswordCode");
      res.status(200).json({ data: users });
    }
  );
}
const userSevices = new UserServices();
export default userSevices;
