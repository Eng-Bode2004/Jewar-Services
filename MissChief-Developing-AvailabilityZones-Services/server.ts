import "dotenv/config";
import express from "express";
import "./Config/DataBase.js";
import cors from "cors";
import AZ_Routes from "./Routes/AZ_Routes.ts";

// Initialize Express
const app = express();

// Middleware
app.use(express.json());

app.use(express.json());

app.use(cors({
    origin: "*",
    methods: ["GET","POST","PUT","DELETE","PATCH"],
    credentials: true
}));

// Routes
app.use("/api/v1/az", AZ_Routes);

// Start Server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
