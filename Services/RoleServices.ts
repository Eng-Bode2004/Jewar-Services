import RoleModel from "../Models/RoleSchema.ts";

interface RoleData {
    imageUrl?: string;
    arabic_name?: string;
    english_name?: string;
    spanish_name?: string;
    French_name?: string;
    Chinese_name?: string;
    arabic_Description?: string;
    english_Description?: string;
    spanish_Description?: string;
    French_Description?: string;
    Chinese_Description?: string;
}

class RoleServices {

    async createRole(data: RoleData) {
        try {
            const role = await RoleModel.create(data);
            return role;
        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong creating role");
        }
    }

    async findRoleById(id: string) {
        try {
            const role = await RoleModel.findById(id);
            if (!role) {
                throw new Error("Role not found");
            }
            return role;
        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong finding role");
        }
    }

    async findAllRoles() {
        try {
            const roles = await RoleModel.find();
            return roles;
        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong fetching roles");
        }
    }

    async updateRole(id: string, data: Partial<RoleData>) {
        try {
            const role = await RoleModel.findByIdAndUpdate(id, data, {
                new: true,
                runValidators: true,
            });
            if (!role) {
                throw new Error("Role not found");
            }
            return role;
        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong updating role");
        }
    }

    async deleteRoleById(id: string) {
        try {
            const role = await RoleModel.findByIdAndDelete(id);
            if (!role) {
                throw new Error("Role not found");
            }
            return role;
        } catch (error) {
            throw new Error((error as Error).message || "Something went wrong deleting role");
        }
    }

    async findRolesByLanguage(lang: "arabic" | "english" | "spanish" | "french" | "chinese") {
        try {
            const fieldMap: Record<string, string> = {
                arabic: "arabic",
                english: "english",
                spanish: "spanish",
                french: "French",
                chinese: "Chinese",
            };
            const prefix = fieldMap[lang] ?? lang;
            const nameField = `${prefix}_name` as const;
            const descField = `${prefix}_Description` as const;

            const ADMIN_ROLE_ID = "6a3354b39662f99f4a86fb11";

            const roles = await RoleModel.find({
                _id: { $ne: ADMIN_ROLE_ID },
                [nameField]: { $exists: true, $ne: "" },
            }).select(`${nameField} ${descField} imageUrl`);

            return roles.map((role) => ({
                id: role._id,
                name: role[nameField as keyof typeof role],
                description: role[descField as keyof typeof role],
                imageUrl: (role as any).imageUrl,
            }));
        } catch (error) {
            throw new Error((error as Error).message || `Something went wrong fetching ${lang} roles`);
        }
    }
}

export default new RoleServices();
