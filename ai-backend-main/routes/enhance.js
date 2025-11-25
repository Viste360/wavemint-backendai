import express from "express";
import sharp from "sharp";

const router = express.Router();

/**
 * POST /enhance
 * Body: { base64: "..." }
 * Returns: { enhanced: "..." }
 */
router.post("/", async (req, res) => {
  try {
    const { base64 } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "base64_required" });
    }

    console.log("✨ Enhancing artwork…");

    // Convert incoming base64 → buffer
    const imgBuffer = Buffer.from(base64, "base64");

    // Load metadata
    const meta = await sharp(imgBuffer).metadata();

    // Work at a slightly higher resolution
    const upscale = meta.width < 1024;

    let pipeline = sharp(imgBuffer);

    if (upscale) {
      pipeline = pipeline.resize({
        width: 1024,
        height: null,
        fit: "inside",
      });
    }

    // Apply enhancement operations
    pipeline = pipeline
      // Sharpen slightly
      .sharpen({
        sigma: 1.2,
      })
      // Increase contrast
      .modulate({
        brightness: 1.02,
        contrast: 1.20,
        saturation: 1.10,
      });

    // Glow effect (subtle bloom)
    const blurred = await sharp(imgBuffer)
      .blur(20)
      .modulate({ brightness: 1.5 })
      .toBuffer();

    const composite = await pipeline
      .composite([
        {
          input: blurred,
          blend: "screen",
          opacity: 0.15,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    const enhancedBase64 = composite.toString("base64");

    return res.json({
      status: "success",
      enhanced: enhancedBase64,
    });

  } catch (err) {
    console.error("Enhance error:", err);
    return res.status(500).json({ error: "enhance_failed" });
  }
});

export default router;
