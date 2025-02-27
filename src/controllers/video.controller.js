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
        .populate("owner", "avatar fullName username") // Populate owner details (name and email)
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

const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ success: false, message: 'Query parameter is required.' });
    }

    // Search for videos that match the query (in title)
    const suggestions = await Video.find({
        title: { $regex: query, $options: 'i' }
    }).select('title _id');

    return res.status(200).json({ success: true, data: suggestions });
});

// Controller to handle full search for videos
const searchVideos = asyncHandler(async (req, res) => {
    const { query, sort, filter } = req.query;
    if (!query) {
        return res.status(400).json({ success: false, message: 'Query parameter is required.' });
    }

    let queryCondition = { title: { $regex: query, $options: 'i' } };

    if (filter) {
        queryCondition = { ...queryCondition, category: filter };
    }

    let videos = Video.find(queryCondition).select('title _id views thumbnail');

    if (sort === 'views') {
        videos = videos.sort({ views: -1 });
    } else if (sort === 'date') {
        videos = videos.sort({ createdAt: -1 });
    }

    videos = await videos;
    return res.status(200).json({ success: true, data: videos });
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
    console.log({ thumbnaiLocalPath })
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
    const video = await Video.findById(videoId).populate("owner", "username");

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

const getAllVideosByChannel = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const videos = await Video.find({ owner: channelId })
        .populate("owner", "avatar fullName username")
        .sort({ createdAt: -1 });

    if (!videos.length) {
        throw new ApiError(404, "No videos found for this channel");
    }


    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            totalVideos: videos.length
        }, "Videos fetched successfully for the channel")
    );
});


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
const incrementVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (req.user) {
        const user = await User.findById(req.user._id);

        const existingHistoryIndex = user.watchHistory.findIndex(
            (entry) => entry.videoId && entry.videoId.toString() === videoId
        );

        if (existingHistoryIndex !== -1) {
            // Update watched time
            user.watchHistory[existingHistoryIndex].watchedAt = new Date();
        } else {
            // Increment view count and add new history entry
            video.views += 1;
            user.watchHistory.push({
                videoId: videoId,
                watchedAt: new Date(),
            });
        }

        // Save user and video data
        await user.save();
        await video.save();
    } else {
        // If no user is logged in, just increment the view count
        video.views += 1;
        await video.save();
    }

    return res.status(200).json(
        new ApiResponse(200, video, "View count incremented and watched time updated successfully")
    );
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideosByChannel,
    incrementVideoViews,
    searchVideos, getSearchSuggestions
}
