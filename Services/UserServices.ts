import UserModel from "../Models/UserSchema.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class UserServices {

    async RegisterUserPhoneNumber(phone_number: string, password: string, username?: string) {
        const existingPhone = await UserModel.findOne({ phone_number });
        if (existingPhone) throw new Error("Phone number already registered");

        if (!username) {
            username = await this.GenerateRandomUsername();
        } else {
            const existingUsername = await UserModel.findOne({ username });
            if (existingUsername) throw new Error("Username already taken");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            username,
            phone_number,
            password: hashedPassword,
        });

        const CUSTOMER_PROFILE_SERVICE_URL = process.env.CUSTOMER_PROFILE_SERVICE_URL || "http://localhost:5009";
        try {
            const profileRes = await fetch(`${CUSTOMER_PROFILE_SERVICE_URL}/api/v1/customer-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_id: user._id, name: username }),
            });
            if (profileRes.ok) {
                const profileData: any = await profileRes.json();
                const profileId = profileData?.response?._id || profileData?._id;
                if (profileId) {
                    await UserModel.findByIdAndUpdate(user._id, { profile: profileId });
                }
            }
        } catch (err) {
            console.error("Failed to create customer profile:", err);
        }

        const JWT_SECRET = process.env.JWT_SECRET || "savora_jwt_secret_dev";
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        const userObj = user.toObject();
        const { password: _, ...safeUser } = userObj;

        return { user: safeUser, token };
    }

    /////////////////////////////////////////// Register Using Email ///////////////////////////

    async RegisterUserEmail(email: string, password: string, username?: string) {
        const existingEmail = await UserModel.findOne({ email });
        if (existingEmail) throw new Error("Email already registered");

        if (!username) {
            username = await this.GenerateRandomUsername();
        } else {
            const existingUsername = await UserModel.findOne({ username });
            if (existingUsername) throw new Error("Username already taken");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await UserModel.create({
            username,
            email,
            password: hashedPassword,
        });

        const CUSTOMER_PROFILE_SERVICE_URL = process.env.CUSTOMER_PROFILE_SERVICE_URL || "http://localhost:5009";
        try {
            const profileRes = await fetch(`${CUSTOMER_PROFILE_SERVICE_URL}/api/v1/customer-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_id: user._id, name: username }),
            });
            if (profileRes.ok) {
                const profileData: any = await profileRes.json();
                const profileId = profileData?.response?._id || profileData?._id;
                if (profileId) {
                    await UserModel.findByIdAndUpdate(user._id, { profile: profileId });
                }
            }
        } catch (err) {
            console.error("Failed to create customer profile:", err);
        }

        const JWT_SECRET = process.env.JWT_SECRET || "savora_jwt_secret_dev";
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        const userObj = user.toObject();
        const { password: _, ...safeUser } = userObj;

        return { user: safeUser, token };
    }

    /////////////////////////////////////////// Verify User //////////////////////////////

    async VerifyUser(userId: string) {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { isUserVerified: true, isActive: true },
            { new: true }
        );
        if (!user) throw new Error("User not found");
        return user;
    }

    async AssignRole(userId: string, roleId: string) {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { role: roleId },
            { new: true }
        );
        if (!user) throw new Error("User not found");
        return user;
    }

    async AssignProfile(userId: string, profileId: string) {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { profile: profileId },
            { new: true }
        );
        if (!user) throw new Error("User not found");
        return user;
    }

    async ChangePassword(userId: string, oldPassword: string, newPassword: string) {
        const user = await UserModel.findById(userId).select("+password");
        if (!user) throw new Error("User not found");

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) throw new Error("Current password is incorrect");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return user;
    }

    async ChangeLanguage(userId: string, language: string) {
        const validLangs = ["arabic", "english", "french", "spanish", "chinese"];
        if (!validLangs.includes(language)) {
            throw new Error(`Invalid language. Must be one of: ${validLangs.join(", ")}`);
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { language },
            { new: true }
        );
        if (!user) throw new Error("User not found");
        return user;
    }

    async GenerateRandomUsername(): Promise<string> {
        const adjectives = ["happy", "sunny", "cool", "brave", "swift", "smart", "calm", "keen", "kind", "warm"];
        const nouns = ["tiger", "eagle", "panda", "lion", "dolphin", "hawk", "wolf", "fox", "bear", "deer"];

        let username = "";
        let isUnique = false;

        while (!isUnique) {
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const noun = nouns[Math.floor(Math.random() * nouns.length)];
            const num = Math.floor(Math.random() * 1000);
            username = `${adj}_${noun}${num}`;

            const existing = await UserModel.findOne({ username });
            if (!existing) isUnique = true;
        }

        return username;
    }

    async LoginUser(identifier: string, password: string) {
        const user = await UserModel.findOne({
            $or: [{ email: identifier }, { phone_number: identifier }],
        }).select("+password");

        if (!user) throw new Error("Invalid credentials");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");

        // Set user as active on login
        user.isActive = true;
        await user.save();

        const JWT_SECRET = process.env.JWT_SECRET || "savora_jwt_secret_dev";

        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Fetch role details from Role-Services if user has a role assigned
        let roleData: Record<string, any> | null = null;
        if (user.role) {
            try {
                const ROLE_SERVICE_URL = process.env.ROLE_SERVICE_URL || "https://savorarole-services-production.up.railway.app";
                const res = await fetch(`${ROLE_SERVICE_URL}/api/v1/roles/${user.role}`);
                if (res.ok) {
                    const body: any = await res.json();
                    roleData = body.data ?? null;
                }
            } catch (err) {
                console.error("Failed to fetch role details:", err);
            }
        }

        // Fetch customer profile if user has one linked
        let profileData: Record<string, any> | null = null;
        if (user.profile) {
            try {
                const CUSTOMER_PROFILE_SERVICE_URL = process.env.CUSTOMER_PROFILE_SERVICE_URL || "http://localhost:5009";
                const res = await fetch(`${CUSTOMER_PROFILE_SERVICE_URL}/api/v1/customer-profile/${user.profile}`);
                if (res.ok) {
                    const body: any = await res.json();
                    profileData = body?.response ?? body?.data ?? body ?? null;
                }
            } catch (err) {
                console.error("Failed to fetch customer profile:", err);
            }
        }

        const userObj = user.toObject();
        const { password: _, ...safeUser } = userObj;

        return { user: safeUser, token, role: roleData, profile: profileData };
    }

    // ── Phone Login (find or create via OTP) ───────────────────────────────

    async FindOrCreateByPhone(phone: string) {
        let user = await UserModel.findOne({ phone_number: phone });
        if (user) {
            const userObj = user.toObject();
            const { password: _, ...safeUser } = userObj;
            return { user: safeUser, isNew: false };
        }

        const username = await this.GenerateRandomUsername();
        // Create user without password — OTP-based login
        user = await UserModel.create({
            username,
            phone_number: phone,
            password: "otp_only",  // placeholder, never used for OTP login
            isActive: false,
        });

        const userObj = user.toObject();
        const { password: _, ...safeUser } = userObj;
        return { user: safeUser, isNew: true };
    }

    async PhoneLogin(userId: string) {
        const user = await UserModel.findById(userId).select("+password");
        if (!user) throw new Error("User not found");

        user.isActive = true;
        await user.save();

        const JWT_SECRET = process.env.JWT_SECRET || "savora_jwt_secret_dev";
        const token = jwt.sign(
            { id: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Fetch role details if assigned
        let roleData: Record<string, any> | null = null;
        if (user.role) {
            try {
                const ROLE_SERVICE_URL = process.env.ROLE_SERVICE_URL || "https://savorarole-services-production.up.railway.app";
                const res = await fetch(`${ROLE_SERVICE_URL}/api/v1/roles/${user.role}`);
                if (res.ok) {
                    const body: any = await res.json();
                    roleData = body.data ?? null;
                }
            } catch (err) {
                console.error("Failed to fetch role details:", err);
            }
        }

        const userObj = user.toObject();
        const { password: _, ...safeUser } = userObj;
        return { user: safeUser, token, role: roleData };
    }

    // ── Forgot / Reset Password ────────────────────────────────────────────

    async ForgotPassword(identifier: string) {
        const user = await UserModel.findOne({
            $or: [{ email: identifier }, { phone_number: identifier }],
        });
        if (!user) throw new Error("No account found with that email or phone");

        const OTP_SERVICE_URL = process.env.OTP_SERVICE_URL || "https://savoraotp-services-production.up.railway.app";
        const isEmail = identifier.includes("@");

        try {
            if (isEmail) {
                await fetch(`${OTP_SERVICE_URL}/api/v1/otp/send/email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: identifier, userID: user._id.toString() }),
                });
            } else {
                await fetch(`${OTP_SERVICE_URL}/api/v1/otp/send/phone`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: identifier, userID: user._id.toString() }),
                });
            }
        } catch (err) {
            console.error("Failed to send OTP:", err);
            throw new Error("Failed to send verification code");
        }

        return { userId: user._id.toString(), message: "Verification code sent" };
    }

    async ResetPassword(userId: string, newPassword: string) {
        const user = await UserModel.findById(userId).select("+password");
        if (!user) throw new Error("User not found");

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return { message: "Password reset successfully" };
    }

    async GetUserLanguage(id: string) {
        const user = await UserModel.findById(id).select("language");
        if (!user) throw new Error("User not found");
        return { userId: user._id, language: user.language };
    }

    async FindUserById(id: string) {
        const user = await UserModel.findById(id);
        if (!user) throw new Error("User not found");
        return user;
    }

    async FindAllUsers() {
        return await UserModel.find();
    }

    async DeleteUser(id: string) {
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) throw new Error("User not found");
        return user;
    }
}

export default new UserServices();
