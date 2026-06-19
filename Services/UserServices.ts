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

        return user;
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

        return user;
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
        ).populate("role");
        if (!user) throw new Error("User not found");
        return user;
    }

    async AssignProfile(userId: string, profileId: string) {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { profile: profileId },
            { new: true }
        ).populate("profile");
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

    async GetUserLanguage(id: string) {
        const user = await UserModel.findById(id).select("language");
        if (!user) throw new Error("User not found");
        return { userId: user._id, language: user.language };
    }

    async FindUserById(id: string) {
        const user = await UserModel.findById(id).populate("role profile");
        if (!user) throw new Error("User not found");
        return user;
    }

    async FindAllUsers() {
        return await UserModel.find().populate("role profile");
    }

    async DeleteUser(id: string) {
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) throw new Error("User not found");
        return user;
    }
}

export default new UserServices();
