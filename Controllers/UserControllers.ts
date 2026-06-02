import type { Request, Response } from "express";
import UserServices from "../Services/UserServices.ts";

class UserControllers {

    async registerWithPhone(req: Request, res: Response) {
        try {
            const { phone_number, password, username } = req.body;
            const user = await UserServices.RegisterUserPhoneNumber(phone_number, password, username);

            res.status(201).json({
                message: "User registered successfully",
                statusCode: 201,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && (
                error.message.includes("already registered") ||
                error.message.includes("already taken")
            ) ? 409 : 400;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async registerWithEmail(req: Request, res: Response) {
        try {
            const { email, password, username } = req.body;
            const user = await UserServices.RegisterUserEmail(email, password, username);

            res.status(201).json({
                message: "User registered successfully",
                statusCode: 201,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && (
                error.message.includes("already registered") ||
                error.message.includes("already taken")
            ) ? 409 : 400;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async login(req: Request, res: Response) {
        try {
            const { identifier, password } = req.body;
            const result = await UserServices.LoginUser(identifier, password);

            res.status(200).json({
                message: "Login successful",
                statusCode: 200,
                data: result,
            });
        } catch (error: unknown) {
            res.status(401).json({
                error: error instanceof Error ? error.message : "Invalid credentials",
                statusCode: 401,
            });
        }
    }

    async verifyUser(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const user = await UserServices.VerifyUser(id);

            res.status(200).json({
                message: "User verified successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "User not found" ? 404 : 500;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async assignRole(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { roleId } = req.body;
            const user = await UserServices.AssignRole(id, roleId);

            res.status(200).json({
                message: "Role assigned successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "User not found" ? 404 : 400;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async assignProfile(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { profileId } = req.body;
            const user = await UserServices.AssignProfile(id, profileId);

            res.status(200).json({
                message: "Profile assigned successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "User not found" ? 404 : 400;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async changePassword(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { oldPassword, newPassword } = req.body;
            const user = await UserServices.ChangePassword(id, oldPassword, newPassword);

            res.status(200).json({
                message: "Password changed successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            let status = 400;
            if (error instanceof Error) {
                if (error.message === "User not found") status = 404;
                if (error.message === "Current password is incorrect") status = 401;
            }
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async changeLanguage(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const { language } = req.body;
            const user = await UserServices.ChangeLanguage(id, language);

            res.status(200).json({
                message: "Language changed successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            const status = error instanceof Error && error.message === "User not found" ? 404 : 400;
            res.status(status).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: status,
            });
        }
    }

    async generateUsername(_req: Request, res: Response) {
        try {
            const username = await UserServices.GenerateRandomUsername();

            res.status(200).json({
                message: "Username generated successfully",
                statusCode: 200,
                data: { username },
            });
        } catch (error: unknown) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: 500,
            });
        }
    }

    async getUserLanguage(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const result = await UserServices.GetUserLanguage(id);

            res.status(200).json({
                message: "User language fetched successfully",
                statusCode: 200,
                data: result,
            });
        } catch (error: unknown) {
            res.status(404).json({
                error: error instanceof Error ? error.message : "User not found",
                statusCode: 404,
            });
        }
    }

    async getUserById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const user = await UserServices.FindUserById(id);

            res.status(200).json({
                message: "User fetched successfully",
                statusCode: 200,
                data: user,
            });
        } catch (error: unknown) {
            res.status(404).json({
                error: error instanceof Error ? error.message : "User not found",
                statusCode: 404,
            });
        }
    }

    async getAllUsers(_req: Request, res: Response) {
        try {
            const users = await UserServices.FindAllUsers();

            res.status(200).json({
                message: "Users fetched successfully",
                statusCode: 200,
                data: users,
            });
        } catch (error: unknown) {
            res.status(500).json({
                error: error instanceof Error ? error.message : "Unknown error occurred",
                statusCode: 500,
            });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            await UserServices.DeleteUser(id);

            res.status(200).json({
                message: "User deleted successfully",
                statusCode: 200,
            });
        } catch (error: unknown) {
            res.status(404).json({
                error: error instanceof Error ? error.message : "User not found",
                statusCode: 404,
            });
        }
    }
}

export default new UserControllers();
