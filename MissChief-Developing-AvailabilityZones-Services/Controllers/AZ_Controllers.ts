import type { Request, Response } from "express";
import AZ_Services from "../Services/AZ_Services";

class AZ_Controllers {

    // Create new zone
    async createZone(req: Request, res: Response): Promise<Response> {
        try {
            const zoneData = req.body;
            const zone = await AZ_Services.createZone(zoneData);
            return res.status(200).json({
                status: "success",
                message: "Zone created successfully",
                response: zone
            });
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    // Get all zones
    async getAllZones(req: Request, res: Response): Promise<Response> {
        try {
            const zones = await AZ_Services.getAllZones();
            return res.status(200).json({
                status: "success",
                response: zones
            });
        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    // Get zone by ID
    async getZoneById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const zone = await AZ_Services.getZoneById(id);
            return res.status(200).json({
                status: "success",
                response: zone
            });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Zone not found"
            });
        }
    }

    // Update zone
    async updateZone(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const data = req.body;
            const zone = await AZ_Services.updateZone(id, data);
            return res.status(200).json({
                status: "success",
                message: "Zone updated successfully",
                response: zone
            });
        } catch (error) {
            return res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Update failed"
            });
        }
    }

    // Delete zone
    async deleteZone(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const result = await AZ_Services.deleteZone(id);
            return res.status(200).json({
                status: "success",
                message: result.message
            });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Delete failed"
            });
        }
    }

    // Toggle zone active/inactive
    async toggleZoneStatus(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const zone = await AZ_Services.toggleZoneStatus(id);
            return res.status(200).json({
                status: "success",
                message: `Zone is now ${zone.status}`,
                response: zone
            });
        } catch (error) {
            return res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Toggle failed"
            });
        }
    }

    async checkLocation(req: Request, res: Response): Promise<Response> {
        try {
            const { lat, lng } = req.body;

            if (lat == null || lng == null) {
                return res.status(400).json({
                    status: "error",
                    message: "Latitude and longitude are required"
                });
            }

            const result = await AZ_Services.checkLocation({ lat, lng });

            return res.status(200).json({
                status: "success",
                response: result
            });

        } catch (error) {
            return res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
}

export default new AZ_Controllers();
