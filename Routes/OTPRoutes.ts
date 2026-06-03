import OTPControllers from "../Controllers/OTPControllers.ts";
import { validateOTPSend, validateOTPVerify } from "../Middlewares/ValidateOTPRequest.ts";
import express from "express";

const router = express.Router();

router.post("/send/email", validateOTPSend, OTPControllers.sendEmailOTP);
router.post("/send/phone", validateOTPSend, OTPControllers.sendPhoneOTP);
router.post("/send/whatsapp", validateOTPSend, OTPControllers.sendWhatsAppOTP);
router.post("/verify", validateOTPVerify, OTPControllers.verifyOTP);
router.get("/history/:userID", OTPControllers.getOTPHistory);

export default router;
