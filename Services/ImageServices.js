import cloudinary from "../Config/cloudinary.js";
import ImagesSchema from "../Models/ImagesShema.js";

class ImageServices {
    async uploadPhoto(data) {
        const { buffer, mimetype, originalname, folder, title, description } = data;

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: "image",
                },
                (error, response) => {
                    if (error) return reject(error);
                    return resolve(response);
                }
            );
            stream.end(buffer);
        });

        const newImage = new ImagesSchema({
            URL: result.secure_url || result.url,
            title: title || originalname || "Untitled",
            description: description || "",
        });

        return await newImage.save();
    }
}

export default new ImageServices();
