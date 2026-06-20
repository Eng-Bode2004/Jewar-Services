import express from "express";
import DishControllers from "../Controllers/DishControllers.js";

const router = express.Router();

router.post("/", DishControllers.create);
router.get("/", DishControllers.getAll);
router.get("/language/:lang", DishControllers.getByLanguage);
router.get("/by-subcategory/:subcategoryId", DishControllers.getBySubcategory);
router.get("/:id", DishControllers.getById);
router.put("/:id", DishControllers.update);
router.delete("/:id", DishControllers.remove);

export default router;
