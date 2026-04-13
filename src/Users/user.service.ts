import AsyncHandler from "express-async-handler";
import userSchema from "./user.schema";
import Users from "./user.interface";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import Token from "../middlewares/Tokens";
import { ErrorHandler } from "../middlewares/errorHandler";
import sendEmail from "../utils/sendEmail";


class UserServices {
  gettAllUser = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const users: Users[] | null = await userSchema.find().select("-password -verifyCode -forgetPasswordCode");
    res.status(200).json({ data: users });
  });
  login = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user: Users | null = await userSchema.findOne({
      email: req.body.email,
    });
    if (!user) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }

    // Defense in depth: never rely only on validation middleware for password checks.
    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return next(new ErrorHandler(400, "Invalid email or password"));
    }

    const token = Token.createToken(user);
    const { password, verifyCode, forgetPasswordCode, ...safeUser } = user.toObject();
    res.status(200).json({ data: safeUser, token: token });
  });
  register = AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const verifyCode =  Math.floor(100000 + Math.random() * 900000).toString();
     const user = {
      username: req.body.username,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
      role: req.body.role || "member",
      verifyCode: verifyCode,
    };
    
    try {
      await sendEmail({
        verifyCode: verifyCode,
        subject: "You verification code is ",
        email: user.email.toString(),
      }); 
    } catch (emailError: any) {
      console.error("Email sending failed:", emailError);
      return next(new ErrorHandler(500, `Email failed: ${emailError.message || "Check SMTP settings"}`));
    }

    const token = Token.createVerificationToken(user);
    res.status(200).json({
      token: token,
      message: "verification code sent successfully Please check your email",
    });
  });
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
        res.status(200).json({ message: "You have registered successfully" });
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
        return next(new ErrorHandler(404, "User not found"));
      }
      await sendEmail({
        verifyCode: verifyCode,
        subject: "Your reset code is",
        email: user.email.toString(),
      });
      user.forgetPasswordCode = await bcrypt.hash(verifyCode, 10);
      await user.save();
      const token = Token.createTokenCode(user);
      res
        .status(200)
        .json({ message: "Reset code sent successfully", token: token });
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
  updatePassword = AsyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { oldPassword, newPassword } = req.body;
      const user = await userSchema.findById(req.CurrentUser._id);
      if (!user) {
        return next(new ErrorHandler(404, "User not found"));
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return next(new ErrorHandler(400, "Invalid old password"));
      }
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
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
