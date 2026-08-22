import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import DriverProfileRoutes from "./Routes/DriverProfileRoutes.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v2/driver-profile", DriverProfileRoutes);

const PORT = process.env.PORT || 5013;
// Accept both spellings used across the platform's services
const MONGO_URI = process.env.MONGOURI || process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ CRITICAL: MONGOURI is undefined!");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.listen(PORT, () => {
    console.log(`🚀 DriverProfile-Services is running on port ${PORT}`);
});
