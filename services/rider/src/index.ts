import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import riderRoutes from "./routes/rider.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOrderReadyConsumer } from "./config/orderReady.consumer.js";

dotenv.config();
const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(express.json());
app.use(cors({ origin: frontendUrl }));
app.use("/api/rider", riderRoutes);

const start = async () => {
  await connectDB();
  await connectRabbitMQ();
  startOrderReadyConsumer();
  const port = process.env.PORT || 5005;
  app.listen(port, () => console.log(`Rider service is running on port ${port}`));
};

start().catch((error) => {
  console.error("Rider service failed to start", error);
  process.exit(1);
});
