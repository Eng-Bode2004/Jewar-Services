import type { Request, Response } from "express";
import AddressServices from "../Services/AddressServices";

class AddressController {

    async create(req: Request, res: Response) {
        try {
            const result = await AddressServices.createAddress(req.body);
            res.status(201).json(result);
        } catch (error: unknown) {
            res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Failed to create address",
            });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const filter = req.query.Profile_id ? { Profile_id: req.query.Profile_id } : {};
            const result = await AddressServices.getAllAddresses(filter);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Failed to fetch addresses",
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const result = await AddressServices.getAddressById(req.params.id as string);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Address not found",
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const result = await AddressServices.updateAddress(req.params.id as string, req.body);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Failed to update address",
            });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const result = await AddressServices.deleteAddress(req.params.id as string);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Failed to delete address",
            });
        }
    }

    async setPrimary(req: Request, res: Response) {
        try {
            const { profileId, addressId } = req.body;
            if (!profileId || !addressId) {
                res.status(400).json({ status: "error", message: "profileId and addressId are required" });
                return;
            }
            const result = await AddressServices.setPrimary(profileId, addressId);
            res.status(200).json(result);
        } catch (error: unknown) {
            res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Failed to set primary address",
            });
        }
    }

}

export default new AddressController();
