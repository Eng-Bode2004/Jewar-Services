import express from "express";
import PreferredDishChiefControllers from "../Controllers/PreferredDishChiefControllers";

const router = express.Router();

// ── Preferred Dishes ───────────────────────────────────────────────────
router.post("/preferred", PreferredDishChiefControllers.setPreferred);
router.get("/preferred/:chiefId", PreferredDishChiefControllers.getPreferredByChief);
router.delete("/preferred", PreferredDishChiefControllers.removePreferred);

// ── Daily Availability ─────────────────────────────────────────────────
router.post("/availability", PreferredDishChiefControllers.setDailyAvailability);
router.get("/availability/chief/:chiefId/date/:date", PreferredDishChiefControllers.getAvailabilityByChiefAndDate);
router.get("/availability/dish/:dishId/date/:date", PreferredDishChiefControllers.getAvailabilityByDishAndDate);
router.get("/availability/date/:date", PreferredDishChiefControllers.getAvailabilityByDate);
router.patch("/availability/:chiefId/:dishId/:date/sold", PreferredDishChiefControllers.updatePiecesSold);

// ── Best Chef Assignment ──────────────────────────────────────────────
router.post("/best-chef", PreferredDishChiefControllers.findBestChef);

// ── Dashboard ──────────────────────────────────────────────────────────
router.get("/dashboard/:date", PreferredDishChiefControllers.getDashboard);

export default router;
