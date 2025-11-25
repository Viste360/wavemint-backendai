import express from "express";
import { generateArtwork } from "../utils/openai.js";

const router = express.Router();

/**
 * POST /artwork/generate
 * Body:
 * {
 *   artistName: "DustDeep",
 *   trackName: "My Song",
 *   color: "#0A84FF"    // auto from frontend
 * }
 */
router.post("/generate", async (req, res) => {
  try {
    const { artistName, trackName, color, style } = req.body;

    if (!artistName || !trackName || !color) {
      return res.status(400).json({
        error: "artistName, trackName, and color are required",
      });
    }

    console.log(`🎨 Generating artwork for ${artistName} – ${trackName}`);
    console.log("Theme color:", color);

    const result = await generateArtwork({
      artistName,
      trackName,
      color,
      style,
    });

    return res.json({
      status: "success",
      square: result.square,       // base64
      vertical: result.vertical,   // base64
    });
  } catch (err) {
    console.error("Artwork generation failed:", err);
    return res.status(500).json({ error: "artwork_generation_failed" });
  }
});

export default router;
