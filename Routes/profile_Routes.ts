import express from "express";
import ProfileControllers from "../Controllers/profile_Controllers.ts";

const router = express.Router();

router.post("/", ProfileControllers.createProfile);

router.get("/", ProfileControllers.getAllProfiles);

router.get("/:id", ProfileControllers.getProfileById);

router.put("/:id", ProfileControllers.editProfile);

router.delete("/:id", ProfileControllers.deleteProfile);

router.patch("/:id/referral", ProfileControllers.generateReferralCode);

router.post("/apply-referral", ProfileControllers.applyReferralCode);

router.patch("/:id/points/add", ProfileControllers.addPoints);

router.patch("/:id/points/deduct", ProfileControllers.deductPoints);

export default router;
