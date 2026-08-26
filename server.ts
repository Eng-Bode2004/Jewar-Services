import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import ChiefProfileRoutes from "./Routes/ChiefProfileRoutes.ts";
import ChatRoutes from "./Routes/ChatRoutes.ts";

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v2/shop-owner-profile", ChiefProfileRoutes);
app.use("/api/v2/chat", ChatRoutes);

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
