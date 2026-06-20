import { Router } from "express";
import CategoryControllers from "../Controllers/CategoryControllers.ts";

const router = Router();

router.post("/", CategoryControllers.createCategory);

router.get("/", CategoryControllers.getAllCategories);

router.get("/language/:lang", CategoryControllers.getByLanguage);

router.get("/:id", CategoryControllers.getCategoryById);

router.put("/:id", CategoryControllers.updateCategory);

router.delete("/:id", CategoryControllers.deleteCategory);

router.get("/:id/subcategories", CategoryControllers.getSubCategories);

export default router;
