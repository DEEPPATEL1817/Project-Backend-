import { Router } from "express";
import { registerUser , loginUser, logoutUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {refreshAccessToken} from "../controllers/user.controller.js"

//here before using registerUser controller we are using middleware before user save thing on server

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT , logoutUser)

//refreshAccessToken endpoint 
userRouter.route("/refresh-token").post(refreshAccessToken)

export default userRouter