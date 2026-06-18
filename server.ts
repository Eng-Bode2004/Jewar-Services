import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.js";
import SubCategoryRoutes from "./Routes/SubCategoryRoutes.ts";

const app = express();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());

app.use("/api/v1/subcategories", SubCategoryRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("❌ Unhandled error:", err);
    return res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 SubCategories service running on port ${PORT}`);
});
