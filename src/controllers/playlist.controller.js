import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";

// Create a Playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id, // Assuming the user is authenticated
        videos: [],
    });

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );
});

// Get all playlists for a user
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 }).populate({
        path: 'videos',
        select: 'thumbnail ',
        populate: {
            path: 'owner', // Populate owner in each video
            select: 'fullName', // Select only the owner's full name and avatar
        }, // Select only title, views, and thumbnail from videos
    });

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );
});

// Get playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos',
            populate: {
                path: 'owner', // Populate owner in each video
                select: 'fullName avatar username', // Select only the owner's full name and avatar
            },
            select: 'title views thumbnail createdAt duration', // Select only title, views, and thumbnail from videos
        })
        .populate({
            path: 'owner', // Populate owner of the playlist
            select: 'avatar fullName _id', // Select avatar, full name, and ID for the playlist owner
        });

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});

// Add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});

// Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist ID or video ID");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId
    );

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    );
});

// Delete a Playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
});

// Update a Playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true, runValidators: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});
const getSubscribedChannelPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming the user is authenticated

    // Find channels the user has subscribed to
    const subscriptions = await Subscription.find({ subscriber: userId }).populate('channel');

    if (!subscriptions || subscriptions.length === 0) {
        throw new ApiError(404, "No subscriptions found for the user");
    }

    // Extract channel IDs from subscriptions
    const channelIds = subscriptions.map(sub => sub.channel._id);

    // Find playlists associated with these channels
    const playlists = await Playlist.find({ owner: { $in: channelIds } })
        .populate({
            path: 'videos',
            select: 'title views thumbnail', // Select necessary video fields
            populate: {
                path: 'owner', // Populate owner in each video
                select: 'fullName username', // Select only the owner's full name and username
            },
        })
        .populate({
            path: 'owner', // Populate owner of the playlist (the channel)
            select: 'fullName avatar', // Select the channel's full name and avatar
        });

    if (!playlists || playlists.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No playlists found for subscribed channels")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, playlists, "Subscribed channel playlists fetched successfully")
    );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getSubscribedChannelPlaylists
};
