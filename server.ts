import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import ChiefProfileRoutes from "./Routes/ChiefProfileRoutes.ts";

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v2/chief-profile", ChiefProfileRoutes);

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
