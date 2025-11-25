import express from "express";
import sharp from "sharp";
import { detectSubjectBase64 } from "../utils/openai.js";

const router = express.Router();

/**
 * POST /smartcrop
 * Body: { base64: "..." }
 * Returns: { square, vertical }
 */
router.post("/", async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "base64_image_required" });
    }

    console.log("🔍 Running smartcrop…");

    // 1. Detect subject bounding box in percentages
    const subject = await detectSubjectBase64(base64);
    console.log("Subject box:", subject);

    const { x, y, width, height } = subject;

    // 2. Convert base64 → raw image buffer
    const imgBuffer = Buffer.from(base64, "base64");

    // Get image metadata
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    // Convert bounding box from percentage → pixel space
    const box = {
      left: Math.max(0, Math.round((x / 100) * imgW)),
      top: Math.max(0, Math.round((y / 100) * imgH)),
      width: Math.round((width / 100) * imgW),
      height: Math.round((height / 100) * imgH),
    };

    // 3. Create 1:1 square crop
    const squareSize = Math.min(imgW, imgH);

    const squareCrop = await sharp(imgBuffer)
      .extract({
        left: Math.max(0, box.left - squareSize / 4),
        top: Math.max(0, box.top - squareSize / 4),
        width: squareSize,
        height: squareSize,
      })
      .resize(1024, 1024)
      .jpeg({ quality: 90 })
      .toBuffer();

    // 4. Create 9:16 vertical crop
    const targetW = 1080;
    const targetH = 1920;
    const aspect = targetW / targetH;

    // Auto-crop region centered around the subject
    const cropW = imgW;
    const cropH = Math.round(cropW / aspect);

    const verticalCrop = await sharp(imgBuffer)
      .extract({
        left: 0,
        top: Math.max(0, box.top - cropH / 3),
        width: cropW,
        height: Math.min(cropH, imgH),
      })
      .resize(targetW, targetH)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Convert back to base64
    const squareBase64 = squareCrop.toString("base64");
    const verticalBase64 = verticalCrop.toString("base64");

    return res.json({
      status: "success",
      square: squareBase64,
      vertical: verticalBase64,
    });

  } catch (err) {
    console.error("Smartcrop error:", err);
    return res.status(500).json({ error: "smartcrop_failed" });
  }
});

export default router;
