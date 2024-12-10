import { handler } from "../utils/handler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {Comment} from "../models/comment.model.js"
import {jwt} from "jsonwebtoken"
import mongoose, { Mongoose } from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


// task: get all comment upload ,delete,update,

const getVideosComments = handler(async(req,res) => {
    const {videoId} = req.params;
    const {page=1,limit=10}= req.query

    if(!videoId){
        throw new ApiError(400,"video ID is required")
    }

    const comments = await  Comment.aggregatePaginate(
        Comment.aggregate([
            {
                $match:{
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from:"users",
                    localField:"owner",
                    foreignField :"_id",
                    as:"ownerDetails"
                }
            },
            {
                $project: {
                    content:1,
                    createdAt:1,
                    owner:1,
                   "ownerDetails.username": 1,
                    "ownerDetails.avatar": 1,

                }
            }
        ]),
        { page, limit }
    )
    res.status(200).json(new ApiResponse(200, "Success", comments));
})


export{getVideosComments}