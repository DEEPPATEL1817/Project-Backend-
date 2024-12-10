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
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video



    const localVideo = await req.file?.path;

    if (!localVideo) {
        throw new ApiError(500,"Error in publishing video")
    }

    const uploadVideo = await uploadOnCloudinary(localVideo);


})

export {getAllVideos,publishAVideo}