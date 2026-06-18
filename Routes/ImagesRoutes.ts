import { Router } from "express";
import ImagesControllers from "../Controllers/ImagesControllers.js";
import Chief_frontID from "../Middleware/Chief-FrontID.ts";
import Chief_backID from "../Middleware/Chief-BackID.ts";
import CategoryImage from "../Middleware/Category-Image.ts";

const router = Router();

router.post("/chief-frontID", Chief_frontID.single("image"), ImagesControllers.uploadPhoto);
router.post("/chief-backID", Chief_backID.single("image"), ImagesControllers.uploadPhoto);
router.post("/category-image", CategoryImage.single("image"), ImagesControllers.uploadPhoto);
export default router;
