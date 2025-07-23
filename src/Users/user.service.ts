import asyncHandler from "express-async-handler";
import userSchema from "./user.schema";
import Users from "./user.interface";
import bcrypt from 'bcrypt'
import {Request,Response,NextFunction} from 'express'
import Token from "../middlewares/Tokens";

class UserService{
    login=asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const {username,password}=req.body
        const user:Users|null=await userSchema.findOne({username:username})
        if(!user){
            return next(new Error('User not found'))
        }
        const isPasswordCorrect=bcrypt.compareSync(password,user.password)
        if(!isPasswordCorrect){
            return next(new Error('Invalid Username or Password'))
        }
       const token= Token.createToken(user)
       console.log(token)
        res.status(200).json({data:{username:user.username,userRole:user.role,UserId:user.id,token:token},message:'User logged in successfully'})
    })
    register=asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
        const newUser:Users=await userSchema.create({
            username:req.body.username,
            password:bcrypt.hashSync(req.body.password,10),
        })
        await newUser.save()
        res.status(201).json({data:newUser.username,message:'User registered successfully'})
    })

   
}
const userService=new UserService()
export default userService  

