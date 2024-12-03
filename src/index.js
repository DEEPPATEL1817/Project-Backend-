import dotenv from "dotenv"
import connectDB from "./db/dbindex.js";
import { app } from "./app.js";

dotenv.config({path:"./env"})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 7000 , ()=>{
        console.log(`server is running at : ${process.env.PORT}`  )
    })
})
.catch((err)=>{
    console.log("mongo db connection failed !!", err)
})











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