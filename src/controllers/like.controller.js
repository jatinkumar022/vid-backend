import mongoose from 'mongoose';
import { Like } from '../models/like.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid video ID');
    }

    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });
    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, 'Video unliked successfully'));
    } else {
        const newLike = new Like({ video: videoId, likedBy: userId });
        await newLike.save();
        return res.status(201).json(new ApiResponse(200, 'Video liked successfully'));
    }
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, 'Invalid comment ID');
    }

    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });
    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, 'Comment unliked successfully'));
    } else {
        const newLike = new Like({ comment: commentId, likedBy: userId });
        await newLike.save();
        return res.status(201).json(new ApiResponse(200, 'Comment liked successfully'));
    }
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, 'Invalid tweet ID');
    }

    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });
    if (existingLike) {
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json(new ApiResponse(200, 'Tweet unliked successfully'));
    } else {
        const newLike = new Like({ tweet: tweetId, likedBy: userId });
        await newLike.save();
        return res.status(201).json(new ApiResponse(200, 'Tweet liked successfully'));
    }
});

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.find({ likedBy: userId, video: { $ne: null } })
        .populate('video')
        .exec();

    if (likedVideos.length === 0) {
        return res.status(404).json(new ApiError(404, 'No liked videos found'));
    }

    return res.status(200).json(new ApiResponse(200, 'Liked videos retrieved successfully', likedVideos));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };