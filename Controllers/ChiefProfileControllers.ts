import type {Request,Response} from "express";
import ChiefProfileServices from "../Services/ChiefProfileServices";

class ChiefProfileController {

    async create(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.createProfile(req.body);
            res.status(201).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getById(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getProfileById(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getAll(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getAllProfiles();
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async update(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.updateProfile(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async delete(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.deleteProfile(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async verify(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.verifyProfile(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

}

export default new ChiefProfileController();
