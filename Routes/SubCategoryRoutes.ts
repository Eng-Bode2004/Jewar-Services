import { Router } from "express";
import SubCategoryControllers from "../Controllers/SubCategoryControllers.ts";

const router = Router();

router.post("/", SubCategoryControllers.createSubCategory);

router.get("/", SubCategoryControllers.getAllSubCategories);

router.get("/language/:lang", SubCategoryControllers.getByLanguage);

router.get("/by-category/:categoryId", SubCategoryControllers.getSubCategoriesByCategory);

router.get("/:id", SubCategoryControllers.getSubCategoryById);

router.put("/:id", SubCategoryControllers.updateSubCategory);

router.delete("/:id", SubCategoryControllers.deleteSubCategory);

export default router;
