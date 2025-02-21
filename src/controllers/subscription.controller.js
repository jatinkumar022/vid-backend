import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Subscription } from '../models/subscription.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const { isValidObjectId } = mongoose;

/**
 * Toggle subscription status between the authenticated user and the specified channel.
 * If a subscription exists, it will be removed (unsubscribe); otherwise, a new subscription will be created (subscribe).
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id; // Assuming req.user contains the authenticated user's information

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, 'Channel not found');
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId,
    });

    if (existingSubscription) {
        // Unsubscribe (remove the subscription)
        await existingSubscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, null, 'Unsubscribed successfully'));
    } else {
        // Subscribe (create a new subscription)
        const newSubscription = new Subscription({
            subscriber: userId,
            channel: channelId,
        });
        await newSubscription.save();
        return res.status(201).json(new ApiResponse(201, newSubscription, 'Subscribed successfully'));
    }
});

/**
 * Retrieve the count of subscribers for a specific channel.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }

    // Check if the channel exists
    const channelExists = await User.exists({ _id: channelId });
    if (!channelExists) {
        throw new ApiError(404, 'Channel not found');
    }

    // Count the number of subscribers for the channel
    const subscriberCount = await Subscription.countDocuments({ channel: channelId });

    return res.status(200).json(new ApiResponse(200, { subscriberCount }, 'Subscriber count fetched successfully'));
});

/**
 * Retrieve the list of channels that a user has subscribed to.
 * If no userId is provided in the URL, it returns the subscribed channels of the currently authenticated user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {

    const currentUserId = req.user._id;

    // Determine the target user ID
    const targetUserId = currentUserId;

    // Validate targetUserId
    if (!isValidObjectId(targetUserId)) {
        throw new ApiError(400, 'Invalid user ID');
    }

    // Check if the user exists
    const userExists = await User.exists({ _id: targetUserId });
    if (!userExists) {
        throw new ApiError(404, 'User not found');
    }


    // Find all subscriptions where the subscriber is the target user
    const subscriptions = await Subscription.find({ subscriber: targetUserId }).populate('channel', 'username avatar fullName');

    // Extract channel information
    const subscribedChannels = subscriptions.map(sub => sub.channel);


    return res.status(200).json(new ApiResponse(200, subscribedChannels, 'Subscribed channels fetched successfully'));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
