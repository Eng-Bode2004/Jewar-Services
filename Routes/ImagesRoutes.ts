import { Router } from "express";
import ImagesControllers from "../Controllers/ImagesControllers.js";
import upload from "../Middleware/Upload-Middleware.ts";
import uploadDishImage from "../Middleware/DishImage-Middleware.ts";

declare module "express-serve-static-core" {
    interface Request {
        uploadFolder?: string;
    }
}

const router = Router();

router.post(
    "/chief-health-certificate",
    (req, _res, next) => { req.uploadFolder = "Savora/Chief/HealthCertificate"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

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

router.post(
    "/subcategory-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Admin/Categories/Sub Category"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/role-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Admin/Roles"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/dish-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Dishes"; next(); },
    uploadDishImage.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/customer-profile-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Customer/ProfileImage"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/chief-profile-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Chief/ProfileImage"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/payment-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Payments"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-vehicle-image",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/Vehicle"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-id-front",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/IDFront"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-id-back",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/IDBack"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-license-front",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/LicenseFront"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-license-back",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/LicenseBack"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/driver-vehicle-license",
    (req, _res, next) => { req.uploadFolder = "Savora/Driver/VehicleLicense"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

// ── Jewar shop onboarding documents ──

router.post(
    "/shop-cover",
    (req, _res, next) => { req.uploadFolder = "Jewar/Shops/Cover"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/shop-id-front",
    (req, _res, next) => { req.uploadFolder = "Jewar/Shops/IDFront"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/shop-id-back",
    (req, _res, next) => { req.uploadFolder = "Jewar/Shops/IDBack"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/tax-record",
    (req, _res, next) => { req.uploadFolder = "Jewar/Shops/TaxRecord"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.post(
    "/tax-card",
    (req, _res, next) => { req.uploadFolder = "Jewar/Shops/TaxCard"; next(); },
    upload.single("image"),
    ImagesControllers.uploadPhoto
);

router.get("/:id", ImagesControllers.getPhotoById);

router.delete("/:id", ImagesControllers.deletePhoto);

export default router;
