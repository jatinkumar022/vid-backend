import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getAllVideosByChannel,
    getSearchSuggestions,
    getVideoById,
    incrementVideoViews,
    publishAVideo,
    searchVideos,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file
router.get('/suggestions', getSearchSuggestions); // Explicit /suggestions route
router.get('/search', searchVideos); // Explicit /search route for full video search

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);
router.route("/c/:channelId").get(getAllVideosByChannel)
router.patch('/:videoId/views', incrementVideoViews);
router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router