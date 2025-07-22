import express from 'express'
import projectRouter from './Project/project.routes'
import userRouter from './Users/user.route'
const Routes=(app:express.Application)=>{
app.use('/api/v1/project',projectRouter)
app.use('/api/v1/user',userRouter)
}
export default Routes