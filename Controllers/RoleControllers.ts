import type { Request, Response } from "express";
import RoleServices from "../Services/RoleServices.ts";

class RoleControllers {

    async createRole(req: Request, res: Response) {
        try {
            const roleData = req.body;
            const role = await RoleServices.createRole(roleData);

            res.status(201).json({
                message: "Role created successfully",
                statusCode: 201,
                data: role,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({
                    error: error.message,
                    statusCode: 400,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }

    async getRoleById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id) {
                res.status(400).json({
                    error: "Role ID is required",
                    statusCode: 400,
                });
                return;
            }

            const role = await RoleServices.findRoleById(id);

            res.status(200).json({
                message: "Role fetched successfully",
                statusCode: 200,
                data: role,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(404).json({
                    error: error.message,
                    statusCode: 404,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }

    async getAllRoles(_req: Request, res: Response) {
        try {
            const roles = await RoleServices.findAllRoles();

            res.status(200).json({
                message: "Roles fetched successfully",
                statusCode: 200,
                data: roles,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(500).json({
                    error: error.message,
                    statusCode: 500,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }

    async updateRole(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id) {
                res.status(400).json({
                    error: "Role ID is required",
                    statusCode: 400,
                });
                return;
            }

            const role = await RoleServices.updateRole(id, req.body);

            res.status(200).json({
                message: "Role updated successfully",
                statusCode: 200,
                data: role,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(400).json({
                    error: error.message,
                    statusCode: 400,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }

    async deleteRole(req: Request, res: Response) {
        try {
            const id = req.params.id as string;

            if (!id) {
                res.status(400).json({
                    error: "Role ID is required",
                    statusCode: 400,
                });
                return;
            }

            await RoleServices.deleteRoleById(id);

            res.status(200).json({
                message: "Role deleted successfully",
                statusCode: 200,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(404).json({
                    error: error.message,
                    statusCode: 404,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }

    async getRolesByLanguage(req: Request, res: Response) {
        try {
            const lang = req.params.lang as string;

            const validLangs = ["arabic", "english", "spanish", "french", "chinese"] as const;
            type Lang = typeof validLangs[number];

            if (!validLangs.includes(lang as Lang)) {
                res.status(400).json({
                    error: `Invalid language. Must be one of: ${validLangs.join(", ")}`,
                    statusCode: 400,
                });
                return;
            }

            const roles = await RoleServices.findRolesByLanguage(lang as Lang);

            res.status(200).json({
                message: `${lang} roles fetched successfully`,
                statusCode: 200,
                data: roles,
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status(500).json({
                    error: error.message,
                    statusCode: 500,
                });
            } else {
                res.status(500).json({
                    message: "Unknown error occurred",
                    statusCode: 500,
                });
            }
        }
    }
}

export default new RoleControllers();
