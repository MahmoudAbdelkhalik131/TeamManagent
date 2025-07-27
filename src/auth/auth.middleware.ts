import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Token from "../middlewares/Tokens";

class Auth {
  verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized1" });
    }
    try {
      const decoded: any = Token.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: "Unauthorized" });
      }
       
      console.log(decoded.payload.role); // Attach the decoded token to the request object
    } catch (err: any) {
      throw new Error(err);
    }
    
    next();
  }
  allowedRoles(roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized1" });
      }
      
        const decoded: any = Token.verifyToken(token);
          console.log(decoded.payload.role+" "+decoded.payload.username)
        if (!decoded) {
          return res.status(401).json({ message: "Unauthorized" });
        }
         
        
        if (roles.includes(decoded.payload.role)) {
          return next();
        }
              return res.status(403).json({ message: "Forbidden" });

        // Attach the decoded token to the request object
      } 
     
    
  }

  // Extract the token from the Authorization header
}

const auth = new Auth();
export default auth;
