import { handler } from "../utils/handler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return {accessToken , refreshToken}

        //here we put false for validate before save because mongo db also ask for password without it ,it send error so we dont want moongose validate and avoid password schema  
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}


const registerUser = handler(async (req,res ) => {

    // steps: 
    // 1.get user details from frontend
    // 2.validation --user should not send empty feilds while registering
    // 3.check if user alresdy exist or not...through username or ElementInternalscheck for Image and avatar
    // 4.upload then to cloudinary
    // 5.create user object - create entry in db
    // 6.remove password and refresh token field from response of db 
    // 7.check for user create or not in db 
    // 8.return response


    //here if user send data through form or json 
    const {fullName,username,email,password}=req.body;
    console.log("email:",email);

    // if(fullName === "") {
    //     throw new ApiError(400,"FullName is required"); 
    // }
    // this is how we can check for ever field like username ,email,password 
    // but here we take another approach
    // here we are using some method

    if([fullName,email,username,password].some((field) => {return field?.trim()==="" }))
    {
        throw new ApiError(400,"All field are requird")
    }

    console.log("all requirements:",fullName,username,email,password)

   const existingUser = await User.findOne({
    $or:[{ username } , { email }]
   })

   console.log("existing user bro",existingUser);

   if (!existingUser) {
    throw new ApiError (409,"User with email and username is already exist");
   }

//    this files method is from multer
   const avatarLocalPath= req.files?.avatar[0]?.path;
   
   //    const coverImageLocalPath = req.files?.coverImage[0]?.path;
   // this above same logic/condition is may not work ..so we use alternate logic for it 
   
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath= req.files.coverImage[0].path
   }

   console.log("Files received from Multer:", req.files);


   if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar is required")
   }
   console.log("Avatar local path:", avatarLocalPath);


//    uploading avatar and coverimg on cloudinary
   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar) {
    throw new ApiError(400,"Avatar files is required")
   }
   
   //    uploading user on db after successful registeration
   const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    // checking in db ...user is created or not and select method is used to select two fields which we dont want to send 
    const userCreated=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!userCreated){
        throw new ApiError(500,"Something went wrong while registering user");
        
    }

    // returning response from db to user
    return res.status(201).json(
        new ApiResponse(200,userCreated,"User Registered Sucessfully")
    )

})

const loginUser = handler(async(req,res)=>{

    // 1.data from  -> req body
    // 2.taking user details ...username,password
    // 3.validate username and password in db
    // 4.generate access token and refresh as well
    // 5.sending this tokens in cookie
    

    const {username,email,password} = req.body;

    if (!username && !email) {
        throw new ApiError(400,"username or password is required")
    }

    const user = await User.findOne({ 
        $or: [{ username } , { email }]
    })

    if(!user ){
        throw new ApiError(404,"User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid ){
        throw new ApiError(401,"Password Incorrect")
    }

    // we are using access and refersh tokens multiple times so are making method so we call it when ever we need  

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //below to send cookies and this two options helps to do  server modifiable only not by frontend
    
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const logoutUser = handler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200, {}, "User Logged Out"))

})

// this refreshAccessToken --> to remain login continously we match refresh token again and again .everytime after access token expires..so user will remain login for longer period of time
const refreshAccessToken = handler(async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401 , "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure: true
        }
    
        const {accessToken , newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken, options)
        .cookie("refreshToken" , newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken , newRefreshToken
                },
                "Access Token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError (401,error?.message || "Invalid refresh token")
    }
    

})

const changeCurrentPassword = handler(async(req,res) => {

    const {oldPassword , newPassaword } = req.body;

    //we can also check 
    // if(!(newPassaword === confirmPassword)){

    // }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // setting new password
    user.password=newPassaword

    // save new password in db
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse (200, {}, "Password Changed Successfully"))
})

const getCurrentUser = handler(async(req,res) => {

    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = handler( async( req, res) => {
    const {fullName, email } = req.body;

    if(!fullName || !email) {
        throw new ApiError (400, "all fields are req")
    }

   const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullName: fullName,
                email : email
            }
        },
        {new:true}
    
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse (200, user,"Account details updated successfully"))
})

// want to update avatar 
const updateUserAvatar = handler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Upload new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    // Find the user and get the old avatar URL
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const oldAvatarUrl = user.avatar;

    // Update the user's avatar in the database
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:
            { 
            avatar: avatar.url
        }
    },
        { new: true } 
    ).select("-password");

    // Delete the old avatar from Cloudinary //delete code is pending
    await deleteOldAvatarFromCloudinary(oldAvatarUrl);

    // Return the updated user
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});


// want to update coverImage 
const updateUserCoverImage = handler(async (req,res) => {
    const coverImageLocalPath=req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiErrorError(400,"cover image file is missing");
    }
        const coverImage = await uploadOnCloudinary (coverImageLocalPath)

        if(!coverImage.url){
            throw new ApiError(400,"Error while uploading avatar")
        }

        const user=await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set:{
                    coverImage: coverImage.url
                }
            },
            {new:true}
        ).select("-password")
        
        return res
        .status(200)
        .json( new ApiResponse(200, user, "Avatar updated successfully")
    )
    
})

const getUserChannelProfile = handler (async(req,res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400, "username is missing")
    }

    //lookup is used in aggregation pipeline to perform join operation btw two collections
    const channel = await User.aggregate([
        {
            $match : {
                username:username?.toLowerCase()
            }
        },
        {
            $lookup :{
                from : "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup :{
                from : "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribersTo"
            }
        },
        {
            $addFields :{
                subscribersCount: {
                    $size :"$subscriptions"
                },
                channelsSubscribedToCount:{
                    $size: "subscribersTo"
                },
                isSubscribed: {
                    $cond:{
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullName :1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel ,"user channel fetched successfully")
    )

})


export { 
    registerUser ,
    loginUser , 
    logoutUser , 
    refreshAccessToken , 
    changeCurrentPassword ,
    getCurrentUser,
    updateAccountDetails,
    updateUserCoverImage, 
    updateUserAvatar,
    getUserChannelProfile
}