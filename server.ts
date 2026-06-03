import "dotenv/config";
import express from "express";
import "./Config/DataBase.js";
import OTPRoutes from "./Routes/OTPRoutes.ts";

const app = express();

app.use(express.json());

app.use("/api/v1/otp", OTPRoutes);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
