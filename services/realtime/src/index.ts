import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRoute from "./routes/internal.js";

dotenv.config();
const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ origin: frontendUrl }));
app.use(express.json());
app.use("/api/v1/internal", internalRoute);

const server = http.createServer(app);
initSocket(server);
const port = process.env.PORT || 5004;
server.listen(port, () => console.log(`Realtime service is running on port ${port}`));
