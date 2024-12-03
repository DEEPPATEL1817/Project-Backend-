import dotenv from "dotenv"
import connectDB from "./db/dbindex.js";

dotenv.config({path:"./env"})

connectDB()












// OR

// const app=express()

// ( async ()=>{
//     try{
//        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//        app.on("error",()=>{
//         console.log("error",error);
//         throw error
//        })
//        app.listen(process.env.PORT,()=>{
//         console.log(`app is listining on port ${process.env.PORT}`)
//        })
//     }catch(error){
//         console.log("Error",error)
//         throw error
//     }
// })()

//this is iife code 