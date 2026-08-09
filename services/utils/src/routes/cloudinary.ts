import express from "express";
import cloudinary from "cloudinary";

const router = express.Router();

router.post("/upload", async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { buffer } = req.body;

    if (typeof buffer !== "string" || !buffer.startsWith("data:")) {
      return res.status(400).json({ message: "A valid image buffer is required" });
    }

    const cloud = await cloudinary.v2.uploader.upload(buffer, {
      resource_type: "image",
      folder: "cravemate",
    });

    res.json({ url: cloud.secure_url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Image upload failed";
    res.status(500).json({ message });
  }
});

export default router;
