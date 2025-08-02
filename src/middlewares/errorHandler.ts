import { Request,Response,NextFunction } from "express"
const errorHandler=(err:any,req:Request,res:Response,next:NextFunction)=>{
const status = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
export default errorHandler;