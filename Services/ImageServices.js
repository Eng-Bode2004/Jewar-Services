import cloudinary from "../Config/cloudinary.js";
import ImagesSchema from "../Models/ImagesShema.js";

class ImageServices {
    async uploadPhoto(data) {
        const { buffer, path, mimetype, originalname, folder, title, description } = data;

        let url;
        if (path) {
            // CloudinaryStorage already uploaded — path is the URL
            url = path;
        } else if (buffer) {
            // memoryStorage — upload to Cloudinary manually
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder, resource_type: "image" },
                    (error, response) => {
                        if (error) return reject(error);
                        return resolve(response);
                    }
                );
                stream.end(buffer);
            });
            url = result.secure_url || result.url;
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
