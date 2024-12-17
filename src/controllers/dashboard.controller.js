import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming user ID is available in req.user

    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    try {
        // Aggregate total video views and total videos
        const videoStats = await Video.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalVideos: { $sum: 1 },
                },
            },
        ]);

        const { totalViews = 0, totalVideos = 0 } = videoStats[0] || {};

        // Count total subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: userId });

        // Aggregate total likes across all videos
        const videoIds = await Video.find({ owner: userId }).distinct('_id');
        const likeStats = await Like.aggregate([
            { $match: { video: { $in: videoIds } } },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: 1 },
                },
            },
        ]);

        const { totalLikes = 0 } = likeStats[0] || {};

        return res.status(200).json(
            new ApiResponse(
                200,
                { totalViews, totalSubscribers, totalVideos, totalLikes },
                "Channel statistics fetched successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching channel statistics");
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming user ID is available in req.user

    // Validate userId
    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    try {
        // Retrieve all videos uploaded by the user
        const videos = await Video.find({ owner: userId });

        return res.status(200).json(
            new ApiResponse(200, videos, "Channel videos fetched successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching channel videos");
    }
});

export { getChannelVideos, getChannelStats };
