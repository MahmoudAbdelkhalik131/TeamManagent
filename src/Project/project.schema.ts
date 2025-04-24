import mongoose from "mongoose";
import Project from "./project.interface";
const ProjectSchema=new mongoose.Schema<Project>({
name:{type:String,unique:true},
duration:{type:String},
color:{type:String}
},{timestamps:true})
const projectSchema= mongoose.model<Project>('project',ProjectSchema)
export default projectSchema