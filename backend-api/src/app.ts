import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import workerRoutes from "./routes/worker.routes.js";
import factoryRoutes from "./routes/factory.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

if (env.nodeEnv === "production" && !env.clientOrigin) {
  throw new Error("CLIENT_ORIGIN must be set in production to prevent wildcard CORS");
}

const allowedOrigins =
  env.clientOrigin === "*"
    ? true
    : env.clientOrigin.split(",").map((o) => o.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

const authLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const otpLimiter   = rateLimit({ windowMs: 10 * 60 * 1000, max: 5,  standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "sketu-backend", authVersion: 2 });
});

app.use("/api/auth/request-otp", otpLimiter);
app.use("/api/auth/verify-login-otp", otpLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/factories", factoryRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
