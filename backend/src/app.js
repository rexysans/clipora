import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import passport from "passport";
import "./config/passport.js";

import healthRoute from "./routes/health.route.js";
import videoRoute from "./routes/videos.route.js";
import progressRouter from "./routes/progress.route.js";
import authRoute from "./routes/auth.route.js";
import followersRoute from "./routes/followers.route.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api", healthRoute);
app.use("/videos", videoRoute);
app.use("/progress", progressRouter);
app.use("/auth", authRoute);
app.use("/users", followersRoute);

export default app;
