import NationalSchema from "../Models/NationalSchema.js";
import vision from "@google-cloud/vision";
import axios from "axios";

class NationalServices {
    constructor() {
        this.client = new vision.ImageAnnotatorClient({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
    }

    // Fetch image from URL and return as buffer
    async fetchImageBuffer(url) {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        return Buffer.from(response.data);
    }

    // Convert Arabic-Indic digits to Latin digits
    arabicToLatinDigits(text) {
        const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
        const latinDigits = "0123456789";
        return text.replace(/[٠-٩]/g, d => latinDigits[arabicDigits.indexOf(d)]);
    }

    // Extract 14-digit Egyptian ID number from image
    async extractIDNumber(imageURL) {
        const buffer = await this.fetchImageBuffer(imageURL);
        const [result] = await this.client.textDetection({ image: { content: buffer } });
        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) return null;

        let fullText = detections[0].description;
        console.log("Detected text from image:", fullText);

        // Convert Arabic-Indic digits to Latin digits
        fullText = this.arabicToLatinDigits(fullText);

        const match = fullText.match(/\b\d{14}\b/); // Egyptian ID = 14 digits
        return match ? match[0] : null;
    }

    // Parse ID number to get Birth_Date, Age, Gender, Government
    parseIDNumber(idNumber) {
        const str = idNumber.toString();
        const centuryCode = str[0]; // 2 → 1900s, 3 → 2000s
        const year = parseInt(str.slice(1, 3));
        const month = parseInt(str.slice(3, 5));
        const day = parseInt(str.slice(5, 7));
        const genderDigit = parseInt(str[12]);

        const birthYear = (centuryCode === '2' ? 1900 : 2000) + year;
        const birthDate = new Date(birthYear, month - 1, day);
        const gender = genderDigit % 2 === 0 ? "Female" : "Male";
        const age = new Date().getFullYear() - birthYear;

        const governmentCode = str.slice(7, 9);
        const governments = {
            "01": "Cairo", "02": "Alexandria", "03": "Port Said", "04": "Suez",
            "11": "Damietta", "12": "Dakahlia", "13": "Sharqia", "14": "Qalyubia",
            "15": "Kafr El Sheikh", "16": "Gharbia", "17": "Monufia", "18": "Beheira",
            "19": "Ismailia", "21": "Giza", "22": "Beni Suef", "23": "Fayoum",
            "24": "Minya", "25": "Asyut", "26": "Sohag", "27": "Qena", "28": "Aswan",
            "29": "Luxor", "31": "Red Sea", "32": "New Valley", "33": "Matrouh",
            "34": "North Sinai", "35": "South Sinai"
        };
        const government = governments[governmentCode] || "Unknown";

        return { Gender: gender, Age: age, Birth_Date: birthDate, Government: government };
    }

    // Main method: create national ID record from image URLs
    async createID(frontImageURL, backImageURL) {
        // 1️⃣ Extract ID number from front image
        const idNumber = await this.extractIDNumber(frontImageURL);
        if (!idNumber) throw new Error("Could not detect ID number");

        // 2️⃣ Parse additional data from ID
        const parsedData = this.parseIDNumber(idNumber);

        // 3️⃣ Save to MongoDB
        const newNational = await NationalSchema.create({
            front_ImageURL: frontImageURL,
            back_ImageURL: backImageURL,
            ID_Number: idNumber,
            ...parsedData
        });

        return newNational;
    }
}

export default new NationalServices();
