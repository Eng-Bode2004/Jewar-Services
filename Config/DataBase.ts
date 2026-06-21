import "dotenv/config";
import mongoose from "mongoose";

const mongoURI = process.env.MONGOURI;

if (!mongoURI) {
    console.error("MONGOURI is not defined in .env");
    process.exit(1);
}

mongoose
    .connect(mongoURI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    });

export default mongoose;
