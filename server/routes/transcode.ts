import { Router } from "express";

const router = Router();

/**
 * Placeholder endpoint for future video transcoding
 * Returns 501 Not Implemented
 * 
 * Future Implementation:
 * - Accept WebM video upload from MediaRecorder
 * - Transcode to MP4 using FFmpeg or cloud service
 * - Return download URL or stream
 */
router.post("/", async (req, res) => {
  res.status(501).json({
    error: "Not Implemented",
    message: "Video transcoding is not yet available. This endpoint is reserved for future video capture functionality.",
    feature: "video-transcode",
    status: "coming-soon"
  });
});

export default router;
