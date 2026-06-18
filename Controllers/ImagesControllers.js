import ImageServices from "../Services/ImageServices.js";

class ImagesControllers {
    async uploadPhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            console.log("::: Uploaded File :::", req.file);

            const imageData = {
                URL: req.file.path || req.file.secure_url,
                title: req.body?.title || req.file.originalname || "Untitled",
                description: req.body?.description || ""
            };

            const savedImage = await ImageServices.uploadPhoto(imageData);

            return res.status(201).json({
                status: "success",
                message: "Uploaded Successfully",
                data: savedImage
            });
        } catch (error) {
            console.error("❌ Upload failed:", error);
            return res.status(500).json({
                status: "error",
                message: error.message || "Upload failed"
            });
        }
    }
}

export default new ImagesControllers();
