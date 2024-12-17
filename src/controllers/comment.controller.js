import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    // Fetch all comments for a video with pagination
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "name email") // Populate user details
        .sort({ createdAt: -1 }) // Sort by newest first
        .skip((pageNumber - 1) * limitNumber) // Pagination skip
        .limit(limitNumber); // Pagination limit

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            meta: {
                total: totalComments,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalComments / limitNumber),
            },
        }, "Comments fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
    // Add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const comment = await Comment.create({
        video: videoId,
        owner: req.user._id,
        content,
    });

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    // Update a comment's content
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { $set: { content } },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found or you're not authorized to update it");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // Delete a comment
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id, // Ensure the comment belongs to the user
    });

    if (!deletedComment) {
        throw new ApiError(404, "Comment not found or you're not authorized to delete it");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Comment deleted successfully")
    );
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
};