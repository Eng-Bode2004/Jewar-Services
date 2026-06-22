import "dotenv/config";
import express from "express";
import cors from "cors";
import "./Config/DataBase.ts";
import AddressRoutes from "./Routes/AddressRoutes.ts";

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok", service: "address" }));

app.use("/api/v1/address", AddressRoutes);

const PORT = process.env.PORT || 5007;

app.listen(PORT, () => {
    console.log(`Address-Service running on port ${PORT}`);
});
