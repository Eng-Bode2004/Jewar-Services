import crypto from "crypto";
import nodemailer from "nodemailer";
import OTPModel from "../Models/OTPSchema.ts";

class OTPServices {

    generateOTP(length = 6): string {
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        return crypto.randomInt(min, max + 1).toString();
    }

    async sendEmailOTP(email: string, userId: string) {
        const otp_code = this.generateOTP();

        await OTPModel.create({
            userID: userId,
            otp_code,
            delivery_method: "email",
            phone: undefined,
        });

        const smtpUser = process.env.SMTP_USER ?? "";
        const smtpPass = process.env.SMTP_PASS ?? "";

        if (!smtpUser || !smtpPass) {
            console.log(`[DEV] Email OTP for ${email}: ${otp_code}`);
            return {
                message: `OTP sent to ${email} (dev mode — check console)`,
                expiresInMinutes: 10,
            };
        }

        try {
            const port = parseInt(process.env.SMTP_PORT ?? "587");
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST ?? "smtp.gmail.com",
                port,
                secure: port === 465,
                auth: { user: smtpUser, pass: smtpPass },
                connectionTimeout: 30000,
                greetingTimeout: 30000,
                socketTimeout: 30000,
            });
            await transporter.sendMail({
                from: `"Savora" <${smtpUser}>`,
                to: email,
                subject: "Your Savora Verification Code",
                text: `Your OTP code is: ${otp_code}\n\nThis code expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
                        <h2 style="color: #E8A838;">Savora</h2>
                        <h3>Your Verification Code</h3>
                        <div style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #2C1810; text-align: center; padding: 20px; background: #F5F3EF; border-radius: 12px; margin: 20px 0;">
                            ${otp_code}
                        </div>
                        <p style="color: #666;">This code expires in <strong>10 minutes</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #eee;">
                        <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                    </div>
                `,
            });
            console.log(`✅ Email OTP sent to ${email}`);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unknown error";
            console.error(`❌ SMTP failed for ${email}: ${errorMsg}`);
            throw new Error(`Failed to send OTP email: ${errorMsg}`);
        }

        return {
            message: `OTP sent to ${email}`,
            expiresInMinutes: 10,
        };
    }

    // _sendEmail removed — inlined above

    async sendPhoneOTP(phone: string, userId: string) {
        const otp_code = this.generateOTP();

        await OTPModel.create({
            userID: userId,
            otp_code,
            delivery_method: "phone",
            phone,
        });

        const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
        const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";

        if (!accountSid || !authToken) {
            console.log(`[DEV] SMS OTP for ${phone}: ${otp_code}`);
            return {
                message: `OTP sent to ${phone} (dev mode — check console)`,
                expiresInMinutes: 10,
            };
        }

        const twilio = await import("twilio");
        const client = twilio.default(accountSid, authToken);

        const from = process.env.TWILIO_SMS_FROM ?? "";
        if (from) {
            await client.messages.create({
                from,
                to: phone,
                body: `Your Savora verification code is: ${otp_code}. Expires in 10 minutes.`,
            });
        } else {
            await client.messages.create({
                to: phone,
                body: `Your Savora verification code is: ${otp_code}. Expires in 10 minutes.`,
            });
        }

        return {
            message: `OTP sent to ${phone} via SMS`,
            expiresInMinutes: 10,
        };
    }

    async sendWhatsAppOTP(phone: string, userId: string) {
        const otp_code = this.generateOTP();

        await OTPModel.create({
            userID: userId,
            otp_code,
            delivery_method: "whatsapp",
            phone,
        });

        const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
        const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";

        if (!accountSid || !authToken) {
            console.log(`[DEV] WhatsApp OTP for ${phone}: ${otp_code}`);
            return {
                message: `OTP sent to ${phone} via WhatsApp (dev mode — check console)`,
                expiresInMinutes: 10,
            };
        }

        const twilio = await import("twilio");
        const client = twilio.default(accountSid, authToken);

        const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";
        await client.messages.create({
            from,
            to: `whatsapp:${phone}`,
            body: `Your Savora verification code is: ${otp_code}. Expires in 10 minutes.`,
        });

        return {
            message: `OTP sent to ${phone} via WhatsApp`,
            expiresInMinutes: 10,
        };
    }

    async verifyOTP(userId: string, otp_code: string) {
        const otp = await OTPModel.findOne({
            userID: userId,
            is_used: false,
        }).select("+otp_code").sort({ createdAt: -1 });

        if (!otp) {
            throw new Error("No active OTP found. Request a new one.");
        }

        if (new Date() > otp.expires_at) {
            throw new Error("OTP has expired. Request a new one.");
        }

        if (otp.attempts >= 5) {
            throw new Error("Too many failed attempts. Request a new OTP.");
        }

        if (otp.otp_code !== otp_code) {
            otp.attempts += 1;
            await otp.save();
            throw new Error(`Invalid OTP. ${5 - otp.attempts} attempts remaining.`);
        }

        otp.is_used = true;
        await otp.save();

        return { message: "OTP verified successfully" };
    }

    async getOTPHistory(userId: string) {
        const otps = await OTPModel.find({ userID: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        return otps.map((otp) => ({
            id: otp._id,
            delivery_method: otp.delivery_method,
            phone: otp.phone,
            is_used: otp.is_used,
            expires_at: otp.expires_at,
            attempts: otp.attempts,
            created_at: otp.createdAt,
        }));
    }
}

export default new OTPServices();
