import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getVideoLikesAndStatus,
    getCommentLikesAndStatus,
    getTweetLikesAndStatus,

} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/v/:videoId").get(getVideoLikesAndStatus)
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/c/:commentId").get(getCommentLikesAndStatus);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/toggle/t/:tweetId").get(getTweetLikesAndStatus);
router.route("/videos").get(getLikedVideos);

export default router