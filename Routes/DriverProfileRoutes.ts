import express from "express";
import DriverProfileController from "../Controllers/DriverProfileControllers.ts";

const router = express.Router();

router.post("/", DriverProfileController.createProfile);
router.get("/", DriverProfileController.getAllProfiles);
router.get("/available", DriverProfileController.getAvailableDrivers);
router.get("/:id", DriverProfileController.getProfileById);
router.get("/:id/location", DriverProfileController.getLocation);
router.get("/auth/:authId", DriverProfileController.getByAuthId);
router.put("/:id", DriverProfileController.updateProfile);
router.delete("/:id", DriverProfileController.deleteProfile);

router.patch("/:id/verify", DriverProfileController.verifyProfile);
router.patch("/:id/verify-step", DriverProfileController.updateVerificationStep);
router.patch("/:id/reject-steps", DriverProfileController.rejectSteps);
router.get("/:id/verification-steps", DriverProfileController.getVerificationSteps);

router.patch("/:id/documents", DriverProfileController.uploadDocument);
router.patch("/:id/license", DriverProfileController.uploadLicense);
router.patch("/:id/online-status", DriverProfileController.setOnlineStatus);
router.patch("/:id/location", DriverProfileController.updateLocation);
router.patch("/:id/rating", DriverProfileController.updateRating);
router.patch("/:id/earnings", DriverProfileController.updateEarnings);
router.patch("/:id/payment-method", DriverProfileController.setPaymentMethod);

router.patch("/admin/settle-earnings/:id", DriverProfileController.settleEarnings);

export default router;
