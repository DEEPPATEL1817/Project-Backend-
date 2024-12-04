import { handler } from "../utils/handler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

   if (existingUser) {
    throw new ApiError (409,"User with email and username is already exist");
   }

//    this files method is from multer
   const avatarLocalPath= req.files?.avatar[0]?.path;
   
   //    const coverImageLocalPath = req.files?.coverImage[0]?.path;
   // this above condition is may not work ..so we use alternate logic for it 
   
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
        username: username.toLowerCase()
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


export {registerUser}