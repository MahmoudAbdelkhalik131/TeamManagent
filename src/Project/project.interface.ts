import { Document } from "mongoose";
interface Project extends Document{
     readonly name:string,
     readonly duration:string
     readonly color:string 
}
export default Project