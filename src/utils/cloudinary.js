// in this file the uploaded items like photo/vid/img from local server is taken and send it to cloudinary


import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


    // Configuration
    cloudinary.config({ 
        cloud_name : process.env.CLOUDINARY_CLOUD_NAME, 
        api_key : process.env.CLOUDINARY_API_KEY, 
        api_secret : process.env.CLOUDINARY_API_SECRET 
    });


const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null;
            // if user give url or localfilepatth then we upload photo/vid on cloudinary
          const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
            //file is uploaded succesfully
            // console.log("file is uploaded on cloudinary successfully",response.url);

            fs.unlinkSync(localFilePath)
            return response;
        } 
        catch (error) {
            fs.unlinkSync(localFilePath) //remove the locally saved temperory file as the upload operation is failed
            return null
        }
    }

export {uploadOnCloudinary}