import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: () => ({
        folder: "Savora/Admin/Categories",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
    }),
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
