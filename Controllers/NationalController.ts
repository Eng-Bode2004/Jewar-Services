import type { Request, Response } from "express";
import NationalServices from "../Services/NationalServices.js";

class NationalController {

    // Create National ID from image URLs
    async createFromURL(req: Request, res: Response): Promise<Response> {
        try {
            const { frontImageURL, backImageURL } = req.body;

            if (!frontImageURL || !backImageURL) {
                return res.status(400).json({ error: "Both frontImageURL and backImageURL are required" });
            }

            // Call service to extract ID and create record
            const nationalRecord = await NationalServices.createID(frontImageURL, backImageURL);

            return res.status(201).json({
                message: "National ID processed successfully",
                data: nationalRecord
            });

        } catch (error: unknown) {
            console.error(error);

            // Type-safe error message
            const message = error instanceof Error ? error.message : "Internal Server Error";
            return res.status(500).json({ error: message });
        }
    }
}

export default new NationalController();
