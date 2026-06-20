import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (_req, _file) => ({
        folder: "Savora/Dishes",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    }),
});

const uploadDishImage = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp"];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only jpg, jpeg, png, webp are allowed"));
        }
    },
});

export default uploadDishImage;
