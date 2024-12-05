import { handler } from "../utils/handler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"


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

const loginUser = handler(async(req,res)=>{

    // 1.data from  -> req body
    // 2.taking user details ...username,password
    // 3.validate username and password in db
    // 4.generate access token and refresh as well
    // 5.sending this tokens in cookie
    

    const {username,email,password} = req.body;

    if (!username || password) {
        throw new ApiError(400,"username or password is required")
    }

    const user = User.findOne({ 
        $or: [{ username } || { password }]
    })

    if(!username ){
        throw new ApiError(404,"User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid ){
        throw new ApiError(404,"Password Incorrect")
    }

    // we are using access and refersh tokens multiple times so are making method so we call it when ever we need  

    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await user.findById(user._id).select("-password -refreshToken")

    //below to send cookies and this two options helps to do  server modifiable only not by frontend
    
    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken)
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

export { registerUser , loginUser , logoutUser }