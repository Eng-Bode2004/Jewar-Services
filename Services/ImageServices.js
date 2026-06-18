import ImagesSchema from "../Models/ImagesShema.js";

class ImageServices {
    async uploadPhoto(ImageData) {
        try {
            const {URL,title,description} = ImageData;
            if (!URL||!title){
                return Promise.reject(new Error("URL and Title are required"));
            }
            const newImage =new ImagesSchema({
                URL,
                title,
                description,
            })
            return await newImage.save();

        }
        catch (error) {
           return Promise.reject(new Error("Upload failed"));
        }
    }
}
export default new ImageServices();