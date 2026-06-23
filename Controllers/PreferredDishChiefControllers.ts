import type { Request, Response } from "express";
import PreferredDishChiefServices from "../Services/PreferredDishChiefServices";

class PreferredDishChiefController {
    // ── Preferred Dishes ─────────────────────────────────────────────────

    async setPreferred(req: Request, res: Response) {
        try {
            const { chiefId, dishId, preferred } = req.body;
            const result = await PreferredDishChiefServices.setPreferred(
                chiefId,
                dishId,
                preferred ?? true
            );
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getPreferredByChief(req: Request, res: Response) {
        try {
            const chiefId = req.params.chiefId! as string;
            const result = await PreferredDishChiefServices.getPreferredByChief(chiefId);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async removePreferred(req: Request, res: Response) {
        try {
            const { chiefId, dishId } = req.body;
            const result = await PreferredDishChiefServices.removePreferred(
                chiefId,
                dishId
            );
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    // ── Daily Availability ───────────────────────────────────────────────

    async setDailyAvailability(req: Request, res: Response) {
        try {
            const { chiefId, dishId, date, piecesAvailable } = req.body;
            const result = await PreferredDishChiefServices.setDailyAvailability(
                chiefId,
                dishId,
                date,
                piecesAvailable
            );
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getAvailabilityByChiefAndDate(req: Request, res: Response) {
        try {
            const chiefId = req.params.chiefId! as string;
            const date = req.params.date! as string;
            const result =
                await PreferredDishChiefServices.getAvailabilityByChiefAndDate(chiefId, date);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getAvailabilityByDishAndDate(req: Request, res: Response) {
        try {
            const dishId = req.params.dishId! as string;
            const date = req.params.date! as string;
            const result =
                await PreferredDishChiefServices.getAvailabilityByDishAndDate(dishId, date);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async getAvailabilityByDate(req: Request, res: Response) {
        try {
            const date = req.params.date! as string;
            const result = await PreferredDishChiefServices.getAvailabilityByDate(date);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    async updatePiecesSold(req: Request, res: Response) {
        try {
            const chiefId = req.params.chiefId! as string;
            const dishId = req.params.dishId! as string;
            const date = req.params.date! as string;
            const { piecesSold } = req.body;
            const result = await PreferredDishChiefServices.updatePiecesSold(
                chiefId,
                dishId,
                date,
                piecesSold
            );
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    // ── Best Chef Assignment ────────────────────────────────────────────

    async findBestChef(req: Request, res: Response) {
        try {
            const { items, date } = req.body;
            const result = await PreferredDishChiefServices.findBestChef(items, date);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    // ── Dashboard ────────────────────────────────────────────────────────

    async getDashboard(req: Request, res: Response) {
        try {
            const date = req.params.date! as string;
            const result = await PreferredDishChiefServices.getDashboard(date);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
}

export default new PreferredDishChiefController();
