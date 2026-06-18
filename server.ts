import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.ts";
import RoleRoutes from "./Routes/RoleRoutes.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/roles", RoleRoutes);


const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚀 Role Services is running on port ${PORT}`);
});
