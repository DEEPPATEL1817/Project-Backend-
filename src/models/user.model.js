import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true
            //here making index:true,it enables the searching field in mongodb
        },
        email:{
            type:String,
            required:true,
            lowercase:true,
            unique:true,
            trim:true,
            
        },
        fullName:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true,
        },
        avatar:{
            type:String,
            required:true,
           
        },
        coverImage:{
            type:String,           
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                ref:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"pass is req"]
        },
        refreshToken:{
            type:String,
        }
        
    },{timestamps:true}
)

// here we are using moogse plugin "Pre" it is a mongoose middleware. to add something before it saves in DB ...so we are using it for encryption of password 

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

// it is a custom method to compare the value of password 
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)

}

//to generate jwt secret token
userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

//generating refresh token
userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id:this._id,
       
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}
userSchema.methods.generateRefreshToken = function (){}

export const User = mongoose.model("User",userSchema)

