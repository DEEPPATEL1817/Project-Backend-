import { Router } from "express";
import { registerUser , loginUser, logoutUser, getCurrentUser, updateAccountDetails, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {refreshAccessToken} from "../controllers/user.controller.js"
import { changeCurrentPassword } from "../controllers/user.controller.js";
import { getCurrentUser } from "../controllers/user.controller.js";
import { updateAccountDetails } from "../controllers/user.controller.js";
import { updateUserAvatar } from "../controllers/user.controller.js";
import { updateUserCoverImage } from "../controllers/user.controller.js";
import { getWatchHistory } from "../controllers/user.controller.js";
import { getUserChannelProfile } from "../controllers/user.controller.js";
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

userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)

userRouter.route("/current-user").get(verifyJWT,getCurrentUser)

userRouter.route("/update-account").patch(verifyJWT,updateAccountDetails)

userRouter.route("/avatar").patch(verifyJWT,upload.single ("avatar"), updateUserAvatar)

userRouter.route("cover-image").patch(verifyJWT,upload.single("/covrImage"),updateUserCoverImage)

userRouter.route("/c/:username").get(verifyJWT,getUserChannelProfile)

userRouter.route("/history").get(verifyJWT,getWatchHistory)




export default userRouter