import UserModel from "../Models/UserSchema.ts";
import mongoose from "mongoose";
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
                const ROLE_SERVICE_URL = process.env.ROLE_SERVICE_URL || "https://jewarrole-services-production.up.railway.app";
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

    // â”€â”€ Phone Login (find or create via OTP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    async FindOrCreateByPhone(phone: string) {
        let user = await UserModel.findOne({ phone_number: phone });
        if (user) {
            const userObj = user.toObject();
            const { password: _, ...safeUser } = userObj;
            return { user: safeUser, isNew: false };
        }

        const username = await this.GenerateRandomUsername();
        // Create user without password â€” OTP-based login
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
                const ROLE_SERVICE_URL = process.env.ROLE_SERVICE_URL || "https://jewarrole-services-production.up.railway.app";
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

    // â”€â”€ Forgot / Reset Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        const user = await UserModel.findById(id);
        if (!user) throw new Error("User not found");

        const db = mongoose.connection.db;
        if (!db) throw new Error("Database not connected");

        const IMAGES_SVC = process.env.IMAGES_SERVICE_URL || "https://jewarimage-services-production.up.railway.app/api/v2/images";
        async function deleteUrl(url?: string | null) {
            if (!url) return;
            try {
                await fetch(`${IMAGES_SVC}/delete-by-url`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
            } catch(e) {}
        }
        const oid = (v: unknown): mongoose.Types.ObjectId | null => {
            try { return new mongoose.Types.ObjectId(String(v)); } catch { return null; }
        };

        // ────────────────────────────────────────────────────────────────
        // 1) Customer profile cascade
        // ────────────────────────────────────────────────────────────────
        const cProfile = await db.collection('customerprofiles').findOne({
            $or: [{ auth_id: oid(id) }, { auth_id: id as any }]
        });
        if (cProfile) {
            // NOTE: schema field is `avatar` (not profile_image)
            await deleteUrl(cProfile.avatar);

            const cid = cProfile._id;
            const cidStr = String(cid);
            await db.collection('addresses').deleteMany({ Profile_id: cid });
            // orders store customer_id/chef_id/driver_id as strings
            await db.collection('orders').deleteMany({ customer_id: { $in: [cidStr, cid] } });
            await db.collection('customerprofiles').deleteOne({ _id: cid });
        }

        // ────────────────────────────────────────────────────────────────
        // 2) Driver profile cascade
        // ────────────────────────────────────────────────────────────────
        const dProfile = await db.collection('driver profiles').findOne({
            $or: [{ auth_id: oid(id) }, { auth_id: id as any }]
        });
        if (dProfile) {
            const did = dProfile._id;
            const didStr = String(did);
            const didOid = oid(didStr);

            // Cloudinary images: avatar, vehicle, license, documents
            const dUrls: (string | null | undefined)[] = [
                dProfile.profile_image,
                dProfile?.vehicle?.image,
                dProfile?.license?.front_image,
                dProfile?.license?.back_image,
                dProfile?.license?.vehicle_license_image,
                dProfile?.documents?.id_front,
                dProfile?.documents?.id_back,
                dProfile?.documents?.background_check,
            ];
            for (const u of dUrls) await deleteUrl(u);

            // Detach driver from orders (driver_id stored as string or ObjectId)
            const driverMatch = didOid ? { $or: [{ driver_id: didStr }, { driver_id: didOid }] } : { driver_id: didStr };
            await db.collection('orders').updateMany(driverMatch, { $unset: { driver_id: 1, driver_name: 1 } });

            await db.collection('addresses').deleteMany({ Profile_id: did });
            await db.collection('driver profiles').deleteOne({ _id: did });
        }

        // ────────────────────────────────────────────────────────────────
        // 3) Shop owner profile cascade
        // ────────────────────────────────────────────────────────────────
        const sProfile = await db.collection('shopowner profiles').findOne({
            $or: [{ auth_id: oid(id) }, { auth_id: id as any }]
        });
        if (sProfile) {
            const sid = sProfile._id;
            const sidStr = String(sid);
            const sidOid = oid(sidStr);

            const sUrls: (string | null | undefined)[] = [
                sProfile.profile_image,
                sProfile.shop_cover,
                sProfile.National_ID_Front,
                sProfile.National_ID_Back,
                sProfile.Commercial_Register,
                sProfile.Tax_Record,
                sProfile.Tax_Card,
            ];

            // Dishes reference the shop via ObjectId `Owner_id`
            const dishMatch = sidOid ? { Owner_id: sidOid } : { Owner_id: sid };
            const dishes = await db.collection('dishes').find(dishMatch, { projection: { image: 1 } }).toArray();
            for (const d of dishes) if (d?.image) sUrls.push(d.image);

            const adMatch = sidOid ? { $or: [{ owner_id: sidStr }, { owner_id: sidOid }] } : { owner_id: sidStr };
            const ads = await db.collection('ads').find(adMatch, { projection: { image_url: 1 } }).toArray();
            for (const a of ads) if (a?.image_url) sUrls.push(a.image_url);

            for (const u of sUrls) await deleteUrl(u);

            await db.collection('dishes').deleteMany(dishMatch);
            await db.collection('ads').deleteMany(adMatch);
            await db.collection('preferreddishchiefs').deleteMany(
                sidOid ? { $or: [{ chief_id: sidStr }, { chief_id: sidOid }] } : { chief_id: sidStr }
            );
            await db.collection('dailydishavailabilities').deleteMany(
                sidOid ? { $or: [{ chief_id: sidStr }, { chief_id: sidOid }] } : { chief_id: sidStr }
            );
            await db.collection('orders').deleteMany(
                sidOid ? { $or: [{ chef_id: sidStr }, { chef_id: sidOid }] } : { chef_id: sidStr }
            );
            await db.collection('addresses').deleteMany({ Profile_id: sid });
            await db.collection('shopowner profiles').deleteOne({ _id: sid });
        }

        // ────────────────────────────────────────────────────────────────
        // 4) Finally, the user document itself (also kills refresh tokens)
        // ────────────────────────────────────────────────────────────────
        await UserModel.findByIdAndDelete(id);
        return user;
    }
}

export default new UserServices();
