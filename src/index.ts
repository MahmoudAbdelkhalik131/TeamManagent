import express from 'express'
import projectRouter from './Project/project.routes'
const Routes=(app:express.Application)=>{
app.use('/api/v1/project',projectRouter)
}
export default Routes