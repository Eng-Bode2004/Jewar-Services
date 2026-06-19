import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import UserRoutes from "./Routes/UserRoutes.ts";

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1/users", UserRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
