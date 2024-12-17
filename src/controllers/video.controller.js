import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    // Validate page and limit inputs
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    if (pageNumber <= 0 || limitNumber <= 0) {
        throw new ApiError(400, "Page and limit must be positive integers");
    }

    // Base query object
    const queryObject = {};

    // Query: Search by title or description (case-insensitive)
    if (query) {
        queryObject.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Filter by userId if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        queryObject.owner = userId;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    // Fetch videos with pagination, filtering, and sorting
    const videos = await Video.find(queryObject)
        .populate("owner", "name email") // Populate owner details (name and email)
        .sort(sortOptions)
        .skip((pageNumber - 1) * limitNumber) // Pagination skip
        .limit(limitNumber); // Pagination limit

    // Total count for pagination meta
    const totalVideos = await Video.countDocuments(queryObject);

    // Prepare the response
    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            meta: {
                total: totalVideos,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalVideos / limitNumber),
            },
        }, "Videos fetched successfully")
    );
});

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
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);

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
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
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
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    const deleteVideo = await Video.deleteOne({ _id: videoId });

    return res
        .status(200)
        .json(new ApiResponse(200, deleteVideo, "Video Deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
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
