import express from "express";
import ChiefProfileControllers from "../Controllers/ChiefProfileControllers.ts";

const router = express.Router();

// -----------------------------
// Public or protected routes
// -----------------------------

// Create a new Chief Profile (protected, admin only)
router.post("/", ChiefProfileControllers.create);

// Get all profiles (protected, maybe only Admin or Manager)
router.get("/", ChiefProfileControllers.getAll);

// Get profile by ID (protected, anyone logged in can view)
router.get("/:id", ChiefProfileControllers.getById);

// Update profile by ID (protected, only Admin)
router.put("/:id", ChiefProfileControllers.update);

// Delete profile by ID (protected, only Admin)
router.delete("/:id", ChiefProfileControllers.delete);

// Verify a profile (protected, only Admin)
router.patch("/:id/verify", ChiefProfileControllers.verify);

// Verify a specific step status
router.patch("/:id/verify-step", ChiefProfileControllers.verifyStep);

// Upload health certificate URL
router.patch("/:id/health-certificate", ChiefProfileControllers.uploadHealthCertificate);

export default router;
