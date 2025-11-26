import express from "express";
import cors from "cors";
import authRoute from "./routes/auth.js";
app.use("/auth", authRoute);
import artworkRoute from "./routes/artwork.js";
import smartcropRoute from "./routes/smartcrop.js";
import enhanceRoute from "./routes/enhance.js";

const app = express();

// Security + JSON parsing
app.use(cors());
app.use(express.json({ limit: "50mb" })); // handle large base64 images

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "wavemint-ai-backend",
  });
});

// Routes
app.use("/artwork", artworkRoute);
app.use("/smartcrop", smartcropRoute);
app.use("/enhance", enhanceRoute);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

// Global error handling
app.use((err, req, res, next) => {
  console.error("🔥 AI Backend Error:", err);
  res.status(500).json({ error: "internal_error" });
});

// Port
const PORT = process.env.PORT || 8083;

app.listen(PORT, () => {
  console.log(`🎨 AI Backend running on port ${PORT}`);
});
