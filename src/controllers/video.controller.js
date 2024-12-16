import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (
        [title, description].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnaiLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }
    if (!thumbnaiLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnaiLocalPath)

    const duration = videoFile.duration

    const owner = await User.findById(
        req.user._id
    )
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner
    })


    const createdVideo = await Video.findById(video._id)

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video")
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "Video Uploaded Successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(400, "All fields are required")
    }

    const thumbnailLocalPath = req.file?.path;


    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)


    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading on thumbnail")
    }

    const updateVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideoDetails, "Video updated successfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const deleteVideo = await Video.deleteOne({ _id: videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, deleteVideo, "Video Deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { isPublished } = req.body


    if (isPublished === null || isPublished === undefined) {
        throw new ApiError(400, "Please specify video status");
    }

    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: isPublished
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(200, updateVideo, "Video status changed successfully")
        )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
