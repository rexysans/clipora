import express from "express";
import cors from "cors";
import healthRoute from "./routes/health.route.js";
import videoRoute from "./routes/videos.route.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", healthRoute);
app.use("/videos", videoRoute);

export default app;
