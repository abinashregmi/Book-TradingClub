import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";
import governanceRouter from "./routes/governance.route.js";
import transactionRouter from "./routes/transaction.route.js";
import inquiryRouter from "./routes/inquiry.route.js";
import adminRouter from "./routes/admin.route.js";

dotenv.config({ path: './.env' });

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
  });

// Core Request Parsing Middleware
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);
app.use("/api/governance", governanceRouter);
app.use("/api/transaction", transactionRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/admin", adminRouter);

// Static Client Asset Serving & SPA Fallback
const clientDistPath = path.join(__dirname, "../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

if (fs.existsSync(clientDistPath) && fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      message: "CivicEstate Backend API Server is running.",
      environment: process.env.NODE_ENV || "development",
      clientDevUrl: "http://localhost:5173",
    });
  });
}

// Global Centralized Error Handling Middleware with Detailed Terminal Logging
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
    path: req.originalUrl || req.url,
    method: req.method,
    body: req.body,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});