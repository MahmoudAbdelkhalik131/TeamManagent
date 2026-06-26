// need smome changes here
import { Request, Response, NextFunction } from "express";
import MESSAGES, { AppMessage } from "../utils/messages";

class ErrorHandler extends Error {
  public status: number;
  public code?: string;

  constructor(status: number, message: string | AppMessage, code?: string) {
    if (typeof message === 'object') {
      super(message.message);
      this.code = message.code;
    } else {
      super(message);
      this.code = code;
    }
    this.status = status;
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
  
  // Default values
  let message = err.message || MESSAGES.GENERIC_ERROR.message;
  let code = err.code || 'ERR_UNKNOWN';

  // If the error message was one of our AppMessage objects
  if (err.message && typeof err.message === 'object') {
    message = err.message.message;
    code = err.message.code;
  } else if (typeof err.message === 'string' && err.message.startsWith('{')) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.code && parsed.message) {
        message = parsed.message;
        code = parsed.code;
      }
    } catch (e) {
      // Not JSON, use as is
    }
  } else if (err.code) {
    code = err.code;
  }

  // Handle specific MongoDB/Mongoose or JWT errors
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    message = MESSAGES.AUTH_REQUIRED.message;
    code = MESSAGES.AUTH_REQUIRED.code;
    return res.status(401).json({ message, code });
  }

  // For production, obscure 500 errors
  if (status === 500 && process.env.NODE_ENV === "production") {
    return res.status(500).json({ 
      message: MESSAGES.GENERIC_ERROR.message, 
      code: MESSAGES.GENERIC_ERROR.code 
    });
  }

  // Log details
  if (process.env.NODE_ENV === "production") {
    console.error(`[ERR] ${status} - ${code} - ${message}`);
  } else {
    console.error(err);
  }

  const payload: any = { message, code };

  // Handle express-validator style errors
  if (err.errors && Array.isArray(err.errors)) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== "production") {
    payload.stack = err.stack;
  }
  
  return res.status(status).json(payload);
}
