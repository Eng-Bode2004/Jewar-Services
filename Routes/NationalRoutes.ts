import express from "express";
import NationalController from "../Controllers/NationalController.js";

const router = express.Router();

// Route to create National ID from URLs
router.post("/", NationalController.createFromURL);

export default router;
