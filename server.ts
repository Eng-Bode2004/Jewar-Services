import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import DishRoutes from "./Routes/DishRoutes.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/dishes", DishRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`🚀 Item-Services running on port ${PORT}`);
});
