import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary,
    params: (req: any) => {
        const folder = req.uploadFolder || "Savora/General";
        return {
            folder,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            resource_type: "image",
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
