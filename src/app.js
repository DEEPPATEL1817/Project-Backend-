import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"






const app = express ()

//cors is use to allows us to access resources from different domains also
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


// this express.json is to take data from user ....how much data we can accept at a time 
//this urlencoded is use to recieve data or parameter from url
//this cookieParser is use to access cookies of user through server and also can perfrom CRUD operations

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// import routes
import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users",userRouter)

// eg:http://localhost:7000/api/v1/users then it go to the userRouter and url is like http://localhost:7000/api/v1/users/register and it run the controller of register


export {app}
