// need smome changes here
import { Request, Response, NextFunction } from "express";
import MESSAGES from "../utils/messages";
class ErrorHandler extends Error {
  public status: number;
  public message: string;
  constructor(status: number, message: string) {
    super(message)
    this.status = status;
    this.message = message;
    (err: any, req: Request, res: Response, next: NextFunction) => {
      res.status(this.status).json({
        success: false,
        error: this.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    };
  }
}
export { ErrorHandler };

export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || MESSAGES.GENERIC_ERROR;
console.log(err)
  // log server-side details (avoid logging request body with sensitive fields)
  // keep logs minimal in production
  if (process.env.NODE_ENV === "production") {
    console.error(`[ERR] ${status} - ${message}`);
  } else {
    console.error(err);
  }
  if(err.name === 'UnauthorizedError'){
    return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
  }
  if(err.name === 'JsonWebTokenError'){
    return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
  }
  if(err.name === 'TokenExpiredError'){
    return res.status(401).json({ message: MESSAGES.AUTH_REQUIRED });
  }

  if (status === 500 && process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: MESSAGES.GENERIC_ERROR });
  }

  const payload: any = { message };

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }
  
  return res.status(status).json(payload);
}
