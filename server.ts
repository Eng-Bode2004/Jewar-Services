import "dotenv/config";
import express from "express";
import "./Config/DataBase.js";
import UserRoutes from "./Routes/UserRoutes.js";

// Initialize Express
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/en/users", UserRoutes);

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
