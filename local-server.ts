import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import os from "os";

const app = express();
app.use(cors());
app.use(express.json());

// ── Config ──────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGOURI!;
const PORT = parseInt(process.env.LOCAL_PORT ?? "5003");

const SMTP_HOST = process.env.SMTP_HOST ?? "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER!;
const SMTP_PASS = process.env.SMTP_PASS!;

// ── Mongo OTP Schema ────────────────────────────────────────────────
const OTPSchema = new mongoose.Schema({
  userID:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  otp_code: { type: String, required: true, minlength: 4, maxlength: 6, select: false },
  delivery_method: { type: String, required: true, enum: ["email", "phone", "whatsapp"] },
  is_used:  { type: Boolean, default: false },
  expires_at: { type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) },
  attempts: { type: Number, default: 0, max: 5 },
}, { timestamps: true, versionKey: false });

const OTP = mongoose.model("OTP", OTPSchema);

// ── Helpers ─────────────────────────────────────────────────────────
function generateOTP(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

// ── Routes ──────────────────────────────────────────────────────────

// Send OTP via email
app.post("/api/v1/otp/send/email", async (req, res) => {
  try {
    const { email, userID } = req.body;
    if (!email || !userID) {
      res.status(400).json({ error: "email and userID are required", statusCode: 400 });
      return;
    }

    const otp_code = generateOTP();
    await OTP.create({ userID, otp_code, delivery_method: "email" });

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    await transporter.sendMail({
      from: `"Savora" <${SMTP_USER}>`,
      to: email,
      subject: "Your Savora Verification Code",
      text: `Your OTP code is: ${otp_code}\n\nThis code expires in 10 minutes.`,
      html: `<div style="font-family: Arial;max-width:400px;margin:0 auto">
        <h2 style="color:#E8A838">Savora</h2>
        <h3>Your Verification Code</h3>
        <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#2C1810;text-align:center;padding:20px;background:#F5F3EF;border-radius:12px;margin:20px 0">${otp_code}</div>
        <p style="color:#666">Expires in <strong>10 minutes</strong>.</p></div>`,
    });

    console.log(`✅ OTP sent to ${email}`);
    res.status(200).json({ message: `OTP sent to ${email}`, statusCode: 200, expiresInMinutes: 10 });
  } catch (err: any) {
    console.error("❌ Send error:", err.message);
    res.status(400).json({ error: err.message, statusCode: 400 });
  }
});

// Send OTP via phone (Twilio optional — logs to console if unconfigured)
app.post("/api/v1/otp/send/phone", async (req, res) => {
  try {
    const { phone, userID } = req.body;
    if (!phone || !userID) {
      res.status(400).json({ error: "phone and userID are required", statusCode: 400 });
      return;
    }
    const otp_code = generateOTP();
    await OTP.create({ userID, otp_code, delivery_method: "phone" });
    console.log(`[DEV] SMS OTP for ${phone}: ${otp_code}`);
    res.status(200).json({ message: `OTP sent to ${phone} (dev mode)`, statusCode: 200, expiresInMinutes: 10 });
  } catch (err: any) {
    res.status(400).json({ error: err.message, statusCode: 400 });
  }
});

// Verify OTP
app.post("/api/v1/otp/verify", async (req, res) => {
  try {
    const { userID, otp_code } = req.body;
    if (!userID || !otp_code) {
      res.status(400).json({ error: "userID and otp_code are required", statusCode: 400 });
      return;
    }

    const otp = await OTP.findOne({ userID, is_used: false })
      .select("+otp_code").sort({ createdAt: -1 });

    if (!otp) { res.status(404).json({ error: "No active OTP found", statusCode: 404 }); return; }
    if (new Date() > otp.expires_at) { res.status(410).json({ error: "OTP expired", statusCode: 410 }); return; }
    if (otp.attempts >= 5) { res.status(429).json({ error: "Too many attempts", statusCode: 429 }); return; }
    if (otp.otp_code !== otp_code) {
      otp.attempts += 1; await otp.save();
      res.status(400).json({ error: `Invalid OTP. ${5 - otp.attempts} left`, statusCode: 400 }); return;
    }

    otp.is_used = true; await otp.save();
    res.status(200).json({ message: "OTP verified successfully", statusCode: 200 });
  } catch (err: any) {
    res.status(500).json({ error: err.message, statusCode: 500 });
  }
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Start ───────────────────────────────────────────────────────────
async function start() {
  if (!MONGO_URI) { console.error("❌ MONGOURI not set"); process.exit(1); }
  if (!SMTP_USER || !SMTP_PASS) { console.warn("⚠️  SMTP not configured — OTP will be logged to console"); }

  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

    const ifaces = os.networkInterfaces();
  const ip = Object.values(ifaces).flat().find((i: any) => i.family === "IPv4" && !i.internal)?.address ?? "127.0.0.1";

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Local OTP Server`);
    console.log(`   Local:    http://127.0.0.1:${PORT}`);
    console.log(`   Network:  http://${ip}:${PORT}`);
    console.log(`   Devices on WiFi can use http://${ip}:${PORT} as the OTP base URL\n`);
  });
}

start();
