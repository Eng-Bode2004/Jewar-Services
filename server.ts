import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import PreferredDishChiefRoutes from "./Routes/PreferredDishChiefRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/preferred-dishes-chief", PreferredDishChiefRoutes);

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
    console.log(`🚀 PreferredDishesChief-Services running on port ${PORT}`);
});
