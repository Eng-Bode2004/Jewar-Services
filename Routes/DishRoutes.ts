import express from "express";
import DishControllers from "../Controllers/DishControllers.js";

const router = express.Router();

router.post("/", DishControllers.create);
router.get("/", DishControllers.getAll);
router.get("/language/:lang", DishControllers.getByLanguage);
router.get("/by-subcategory/:subcategoryId", DishControllers.getBySubcategory);

// ── Shop owner items & stock ──
// Items belonging to a shop owner (?all=true also includes global catalog items)
router.get("/by-owner/:ownerId", DishControllers.getByOwner);
// Quick stock update for regular inventory shops
router.patch("/:id/stock", DishControllers.updateStock);
// Set today's available quantity (food-category shops)
router.post("/daily-stock", DishControllers.setDailyStock);
// List a shop's daily stock (?date=YYYY-MM-DD, defaults to today)
router.get("/daily-stock/:ownerId", DishControllers.getDailyStock);

router.get("/:id", DishControllers.getById);
router.put("/:id", DishControllers.update);
router.delete("/:id", DishControllers.remove);

export default router;
