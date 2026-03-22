import { Request, Response, NextFunction } from "express";
import Token from "../middlewares/Tokens";
import userSchema from "../Users/user.schema";

class Auth {
  async verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized1" });
    }
    try {
      const decoded: any = Token.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await userSchema.findOne({
        _id: decoded.user._id.toString(),
      });
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.CurrentUser = decoded.user;

      // Attach the decoded token to the request object
    } catch (err: Error | any) {
      throw new Error(err.message);
    }

    next();
  }
  verifyCodeToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized1" });
    }
    try {
      const decoded: any = Token.verifyTokenCode(token);
      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.CurrentUser = decoded.user;

      // Attach the decoded token to the request object
    } catch (err: any) {
      console.log(token);
      throw new Error(err);
    }

    next();
  }
   allowedRoles(roles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized1" });
      }
      try {
        const decoded: any = Token.verifyToken(token);
        if (!decoded) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await userSchema.findOne({
          _id: decoded.user._id.toString(),
        });
        if (!user) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        req.CurrentUser = decoded.user;
        // Attach the decoded token to the request object
        if (roles.includes(decoded.user.role)) {
          return next();
        }
      } catch (error) {
        return next(error);
      }

      return res.status(403).json({ message: "Forbidden" });

      // Attach the decoded token to the request object
    };
  }

  // Extract the token from the Authorization header
}

const auth = new Auth();
export default auth;
