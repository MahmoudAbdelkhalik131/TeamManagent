import express from "express"
import dotenv from "dotenv"
import Connection from "./config"
import Routes from "./src"
const app:express.Application= express()
app.use(express.json({limit:'10kb'}))
dotenv.config()
Connection()
app.listen(process.env.PORT, ()=>{
    console.log(`server started on port ${process.env.PORT}`)
})

Routes(app)