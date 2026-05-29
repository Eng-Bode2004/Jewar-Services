import type { Request, Response } from "express";
import UserServices from "../Services/UserServices.js";

class UserControllers {

    // ─── Create User ──────────────────────────────────────────────────────────

    async createUser(req: Request, res: Response) {
        try {
            const UserData = req.body;
            const user = await UserServices.createUser(UserData);

            res.status(201).json({
                message: "User created successfully",
                statusCode: 201,
                data: user,
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

    // ─── Generate Random Username (AI) ────────────────────────────────────────

    async createRandomUsernameAI(req: Request, res: Response){
        try {
            const UserData = req.body;

            if (!UserData?.name) {
                res.status(400).json({
                    error: "Name is required to generate a username",
                    statusCode: 400,
                });
                return;
            }

            const username = await UserServices.createRandomUsername(UserData);

            res.status(200).json({
                message: "Username generated successfully",
                statusCode: 200,
                data: { username },
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

export default new UserControllers();