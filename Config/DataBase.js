import "dotenv/config";
import mongoose from "mongoose";

const mongoURI = process.env.MONGOURI;

if (!mongoURI) {
    console.error("❌ CRITICAL: MONGOURI is undefined!");
    process.exit(1);
}

mongoose
    .connect(mongoURI)
    .then(() => {
        console.log("✅ MongoDB Connected Successfully");
    })
    .catch((error) => {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    });

export default mongoose;
