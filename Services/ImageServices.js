import crypto from "crypto";
import cloudinary from "../Config/cloudinary.js";
import ImagesSchema from "../Models/ImagesShema.js";

async function uploadToCloudinary(buffer, folder, mimetype = "image/png", originalname = "image.png") {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

    const fd = new FormData();
    fd.append("file", new Blob([buffer], { type: mimetype }), originalname);
    fd.append("folder", folder);
    fd.append("timestamp", timestamp);
    fd.append("api_key", apiKey);
    fd.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: fd,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || "Cloudinary upload failed");
    return json.secure_url || json.url;
}

class ImageServices {
    async uploadPhoto(data) {
        const { buffer, path, mimetype, originalname, folder, title, description } = data;

        let url;
        if (path) {
            // CloudinaryStorage already uploaded — path is the URL
            url = path;
        } else if (buffer) {
            // memoryStorage — upload to Cloudinary directly (avoids Bun stream bug)
            url = await uploadToCloudinary(buffer, folder, mimetype, originalname);
        } else {
            throw new Error("No file data provided");
        }

        const newImage = new ImagesSchema({
            URL: url,
            title: title || originalname || "Untitled",
            description: description || "",
        });

        return await newImage.save();
    }

    async deletePhoto(imageId) {
        const image = await ImagesSchema.findById(imageId);
        if (!image) throw new Error("Image not found");

        const url = image.URL;
        const publicId = this.extractPublicId(url);
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }

        await ImagesSchema.findByIdAndDelete(imageId);
        return { deleted: true, publicId };
    }

    async getPhotoById(imageId) {
        const image = await ImagesSchema.findById(imageId);
        if (!image) throw new Error("Image not found");
        return image;
    }

    extractPublicId(url) {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|jpeg|png|gif|webp|svg|bmp|tiff?)$/i);
        if (match) return match[1];
        const altMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)$/);
        if (altMatch && !altMatch[1].includes("/")) return altMatch[1];
        return null;
    }
}

export default new ImageServices();
