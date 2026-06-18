import { Router } from "express";
import ImagesControllers from "../Controllers/ImagesControllers.js";
import upload from "../Middleware/Upload-Middleware.ts";

declare module "express-serve-static-core" {
    interface Request {
        uploadFolder?: string;
    }
}

const router = Router();

router.post(
    "/chief-frontID",
    (req, _res, next) => { req.uploadFolder = "Savora/Chief/FrontID"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/chief-backID",
    (req, _res, next) => { req.uploadFolder = "Savora/Chief/BackID"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/category-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Admin/Categories"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

export default router;
