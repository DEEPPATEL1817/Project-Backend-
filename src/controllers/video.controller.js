import mongoose,{isValidObjectId} from "mongoose";
import { handler } from "../utils/handler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getAllVideos = handler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const filter = {};
    if (query) filter.title = { $regex: query, $options: "i" }; // Case-insensitive search
    if (userId && isValidObjectId(userId)) filter.owner = userId;

    const sortOption = { [sortBy]: sortType === "desc" ? -1 : 1 };

    const videos = await Video.aggregatePaginate(
        Video.aggregate([{ $match: filter }]),
        { page: parseInt(page), limit: parseInt(limit), sort: sortOption }
    );

    res.status(200).json(new ApiResponse(200, "Videos fetched successfully", videos));
});



const publishAVideo = handler(async (req, res) => {

    // TODO: get video, upload to cloudinary, create video

    console.log("in publish videos")
    console.log("req files :", req.files)

    const { title, description} = req.body

    if(!title || !description){
        throw new ApiError(400,"please add description and title")
    }

    const localVideoPath = req.file?.videoFile?.path;
    const localThumnailPath = req.file?.thumbnail?.path;

    if(!localVideoPath){
        throw new ApiError(400,"video file is missing")
    }
    if(!localThumnailPath){
        throw new ApiError(400,"Thumbnail file is missing")
    }

    const video = await uploadOnCloudinary(localVideoPath)
    if(!video.url || !video){
        throw new ApiError (500,"Error while uploading video")
    }

    const thumbnail = await uploadOnCloudinary(localThumnailPath)
    if(!localThumnailPath.url || !localThumnailPath){
        throw new ApiError (500,"Error while uploading Thumbnail")
    }

   const newVideo = await Video.create ({
        title:title,
        description,
        video:video.url,
        thumbnail:thumbnail.url,
        owner:req.user._id,
        duration:video.duration || 0,
        views:video.views || 0 ,
        isPUblished: false,
    })
    return res
    .status(200)
    .json(new ApiResponse (200, newVideo,"video Published successfully"))
})

const getVideoById = handler(async (req, res) => {
    const {videoId} = req.params;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video ID")
    }
    const video = await Video.findById(videoId).populate("owner","username avatar")

    if(!video){
        throw new ApiError(404,"video not found")
    }

    return res 
    .status(200)
    .json(200,"Video fetched successfully", video)
})

const updateVideo = handler(async (req, res) => {

    const {videoId} =req.params;
    const {title,description,thumbnail}= req.body;


    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid Video ID")
    }

    const updateData ={};
    if(title){
        updateData.title= title
    }
    if(description){
        updateData.description= description
    }
    



    if(req.file?.path){
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path)
    }

    const updateVideo = await Video.findByIdAndUpdate(videoId,updateData,{new:true});
    if (!updateData) {
        throw new ApiError("400","Video not upload correctly")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updateVideo,"Video upload successfully"))

    


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
}