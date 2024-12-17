import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id; // Assuming user is authenticated

    const tweet = new Tweet({ content, owner: userId });
    await tweet.save();

    res.status(201).json(new ApiResponse(200, 'Tweet created successfully', tweet));
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError('Invalid user ID', 400);
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, 'Tweets retrieved successfully', tweets));
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError('Invalid tweet ID', 400);
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError('Tweet not found', 404);
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError('Unauthorized', 403);
    }

    tweet.content = content || tweet.content;
    await tweet.save();

    res.status(200).json(new ApiResponse(200, 'Tweet updated successfully', tweet));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError('Invalid tweet ID', 400);
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError('Tweet not found', 404);
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError('Unauthorized', 403);
    }

    await tweet.deleteOne({ _id: tweetId });

    res.status(200).json(new ApiResponse(200, 'Tweet deleted successfully'));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
