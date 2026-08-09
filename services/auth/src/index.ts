import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoute from "./routes/auth.js";
import cors from "cors";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
  })
);

app.use(express.json());

// Health check for Render
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CraveMate Auth Service",
  });
});

app.use("/api/auth", authRoute);

const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Auth service is running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error("Auth service failed to start", error);
  process.exit(1);
});