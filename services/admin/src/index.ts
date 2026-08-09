import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import adminRoutes from "./routes/admin.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const app = express();

const frontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: frontendUrl,
  })
);

app.use(express.json());

// Render health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "CraveMate Admin Service",
  });
});

app.use("/api/v1", adminRoutes);

const start = async () => {
  await connectDb();

  app.listen(process.env.PORT || 5006, () => {
    console.log(
      `Admin service is running on port ${process.env.PORT || 5006}`
    );
  });
};

start().catch((error) => {
  console.error("Admin service failed to start", error);
  process.exit(1);
});