import UserSchema from '../Models/UserSchema.js';
import bcrypt from "bcryptjs";


class UserServices {

    // ─── Auth ────────────────────────────────────────────────────────────────

    async createUser(UserData: { username: string; password: string; email: string }) {
        try {
            const { username, password, email } = UserData;

            const existUser = await UserSchema.findOne({
                $or: [{ username }, { email }],
            });

            if (existUser) {
                throw new Error("User already exists");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await UserSchema.create({
                username,
                email,
                Password: hashedPassword,
            });

            return newUser;

        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong creating User");
        }
    }

    // ─── Username Generator (algorithmic, no AI) ──────────────────────────────

    private readonly ADJECTIVES = [
        "swift", "brave", "lunar", "cosmic", "silent", "golden", "wild", "noble",
        "fierce", "mystic", "shadow", "crimson", "frost", "electric", "rapid",
        "iron", "velvet", "neon", "stealth", "atomic", "turbo", "phantom", "royal",
        "savage", "epic", "hyper", "cyber", "solar", "blazing", "arctic",
    ];

    private readonly NOUNS = [
        "wolf", "falcon", "tiger", "phoenix", "dragon", "raven", "viper", "lion",
        "hawk", "panther", "cobra", "shark", "eagle", "fox", "bear", "knight",
        "ninja", "wizard", "ghost", "samurai", "ranger", "hunter", "pilot",
        "rider", "storm", "blade", "comet", "titan", "nova", "specter",
    ];

    // leetspeak substitution map
    private readonly LEET: Record<string, string> = {
        a: "4", e: "3", i: "1", o: "0", s: "5", t: "7",
    };

    private slugify(input: string): string {
        return input
            .normalize("NFD")                  // split accented chars (é → e + ´)
            .replace(/[\u0300-\u036f]/g, "")   // strip the accent marks
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")       // non-alphanumeric → underscore
            .replace(/^_+|_+$/g, "")           // trim leading/trailing underscores
            .replace(/_{2,}/g, "_");           // collapse repeats
    }

    private pick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)]!;
    }

    private randomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private leetify(word: string): string {
        return word
            .split("")
            .map(ch => (Math.random() < 0.4 && this.LEET[ch] ? this.LEET[ch] : ch))
            .join("");
    }

    private clamp(name: string): string {
        // enforce 6–20 chars; pad short ones, trim long ones
        let result = name.replace(/[^a-z0-9_]/g, "").replace(/_{2,}/g, "_");
        if (result.length > 20) result = result.slice(0, 20).replace(/_+$/g, "");
        while (result.length < 6) result += this.randomNumber(0, 9);
        return result;
    }

    /**
     * Builds ONE candidate username using a randomly selected strategy.
     */
    private buildCandidate(base: string): string {
        const sep = this.pick(["", "_", ".", ""]); // weighted toward no separator
        const strategy = this.randomNumber(1, 6);

        switch (strategy) {
            // 1. base + number suffix  →  abdelrahman284
            case 1:
                return this.clamp(`${base}${this.randomNumber(10, 9999)}`);

            // 2. adjective + base  →  swift_abdelrahman
            case 2:
                return this.clamp(`${this.pick(this.ADJECTIVES)}${sep}${base}`);

            // 3. base + noun  →  abdelrahman_wolf
            case 3:
                return this.clamp(`${base}${sep}${this.pick(this.NOUNS)}`);

            // 4. adjective + noun + number  →  cosmicviper42
            case 4:
                return this.clamp(
                    `${this.pick(this.ADJECTIVES)}${this.pick(this.NOUNS)}${this.randomNumber(1, 99)}`
                );

            // 5. leetspeak base + number  →  4bd3lr4hm4n7
            case 5:
                return this.clamp(`${this.leetify(base)}${this.randomNumber(1, 99)}`);

            // 6. base initials + noun + year-ish  →  aa_phoenix_07
            case 6: {
                const initials = base.split("_").map(p => p[0] ?? "").join("");
                return this.clamp(`${initials}${sep}${this.pick(this.NOUNS)}${sep}${this.randomNumber(1, 99)}`);
            }

            default:
                return this.clamp(`${base}${this.randomNumber(100, 999)}`);
        }
    }

    /**
     * Generates a unique, available username derived from the given name.
     * Tries many candidates, checking each against the DB. Guaranteed to return
     * an available username thanks to a timestamp fallback.
     */
    async createRandomUsername(UserData: { name: string }): Promise<string> {
        try {
            const base = this.slugify(UserData?.name || "user") || "user";
            const MAX_ATTEMPTS = 25;

            // Collect a batch of unique candidates first
            const tried = new Set<string>();

            for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
                const candidate = this.buildCandidate(base);

                if (tried.has(candidate)) continue; // skip duplicates we already checked
                tried.add(candidate);

                const exists = await UserSchema.findOne({ username: candidate }).lean();
                if (!exists) {
                    return candidate;
                }
            }

            // Guaranteed-unique fallback using a base36 timestamp tail
            const tail = Date.now().toString(36); // short, e.g. "lq3v8k1"
            const fallback = this.clamp(`${base}_${tail}`);

            // Extremely unlikely, but verify the fallback too
            const fallbackExists = await UserSchema.findOne({ username: fallback }).lean();
            if (!fallbackExists) return fallback;

            // Absolute last resort: add random entropy
            return this.clamp(`${base}_${tail}${this.randomNumber(100, 999)}`);

        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong generating username");
        }
    }
}

export default new UserServices();