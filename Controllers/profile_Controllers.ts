import type { Request, Response } from "express";
import ProfileServices from "../Services/profile_Services.js";

class ProfileControllers {

  async createProfile(req: Request, res: Response): Promise<Response> {
    try {
      const profile = await ProfileServices.createProfile(req.body);
      return res.status(201).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Creation failed",
      });
    }
  }

  async editProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const profile = await ProfileServices.editProfile(id, req.body);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(404).json({
        status: "error",
        message: error instanceof Error ? error.message : "Update failed",
      });
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const profile = await ProfileServices.deleteProfile(id);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(404).json({
        status: "error",
        message: error instanceof Error ? error.message : "Delete failed",
      });
    }
  }

  async getProfileById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const profile = await ProfileServices.getProfileById(id);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(404).json({
        status: "error",
        message: error instanceof Error ? error.message : "Profile not found",
      });
    }
  }

  async getAllProfiles(_req: Request, res: Response): Promise<Response> {
    try {
      const profiles = await ProfileServices.getAllProfiles();
      return res.status(200).json({ status: "success", response: profiles });
    } catch (error) {
      return res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Fetch failed",
      });
    }
  }

  async generateReferralCode(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const profile = await ProfileServices.generateReferralCode(id);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Code generation failed",
      });
    }
  }

  async applyReferralCode(req: Request, res: Response): Promise<Response> {
    try {
      const { code, customerId } = req.body;
      if (!code || !customerId) {
        return res.status(400).json({ status: "error", message: "code and customerId are required" });
      }
      const result = await ProfileServices.applyReferralCode(code, customerId);
      return res.status(200).json({ status: "success", response: result });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Referral apply failed",
      });
    }
  }

  async addPoints(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { points } = req.body;
      if (!points || points < 1) {
        return res.status(400).json({ status: "error", message: "points must be a positive number" });
      }
      const profile = await ProfileServices.addPoints(id, points);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Add points failed",
      });
    }
  }

  async deductPoints(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { points } = req.body;
      if (!points || points < 1) {
        return res.status(400).json({ status: "error", message: "points must be a positive number" });
      }
      const profile = await ProfileServices.deductPoints(id, points);
      return res.status(200).json({ status: "success", response: profile });
    } catch (error) {
      return res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Deduct points failed",
      });
    }
  }
}

export default new ProfileControllers();
