import "dotenv/config";
import express from "express";
import "./Config/DataBase.js";
import cors from "cors";
import multer from "multer";
import ImagesRoutes from "./Routes/ImagesRoutes.ts";
// Initialize Express
const app = express();

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/v2/images", ImagesRoutes);

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("❌ Unhandled error:", err);
    let status = err.status || 500;
    let message = err.message || "Internal Server Error";
    if (err instanceof multer.MulterError) {
        status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        message =
            err.code === "LIMIT_FILE_SIZE"
                ? "File too large. Maximum size is 10MB."
                : err.message;
    }
    return res.status(status).json({ status: "error", message });
});

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
