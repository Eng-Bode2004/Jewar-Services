import PaymentProviderModel from "../Models/PaymentProviderModel.ts";

class PaymentProviderService {

    // ➤ Create Payment Provider
    async createProvider(data) {
        const { name, Provider, type, key } = data;

        if (!name || !Provider || !type) throw new Error("All fields are required");

        // Check duplicate by name or provider ID
        const exist = await PaymentProviderModel.findOne({
            $or: [{ name }, { Provider }]
        });

        if (exist) throw new Error("Payment provider already exists");

        return await PaymentProviderModel.create({ name, Provider, type, is_active: true });
    }

    // ➤ Get All Providers
    async getAllProviders() {
        const providers = await PaymentProviderModel.find().sort({ createdAt: -1 });
        return providers.map(p => ({
            ...p.toObject(),
            status: p.is_active ? "active" : "inactive",
        }));
    }

    // ➤ Update Provider
    async updateProvider(id, data) {
        if (!id) throw new Error("Provider ID is required");

        const provider = await PaymentProviderModel.findById(id);
        if (!provider) throw new Error("Provider not found");

        return await PaymentProviderModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    }

    // ➤ Delete Provider
    async deleteProvider(id) {
        if (!id) throw new Error("Provider ID is required");

        const provider = await PaymentProviderModel.findById(id);
        if (!provider) throw new Error("Provider not found");

        await PaymentProviderModel.findByIdAndDelete(id);
        return { message: "Payment provider deleted successfully" };
    }

    // ➤ Activate / Deactivate provider (toggles current status)
    async toggleStatus(id) {
        const provider = await PaymentProviderModel.findById(id);
        if (!provider) throw new Error("Provider not found");

        provider.is_active = !provider.is_active;
        await provider.save();

        return {
            ...provider.toObject(),
            status: provider.is_active ? "active" : "inactive",
        };
    }

    // ➤ Get Only Active Providers
    async getActiveProviders() {
        const providers = await PaymentProviderModel.find({ is_active: true }).sort({ createdAt: -1 });
        return providers.map(p => ({
            ...p.toObject(),
            status: "active", // all are active
        }));
    }

    // ➤ Get Provider by ID
    async getProviderById(id) {
        if (!id) throw new Error("Provider ID is required");

        const provider = await PaymentProviderModel.findById(id);

        if (!provider) throw new Error("Payment provider not found");

        return {
            ...provider.toObject(),
            status: provider.is_active ? "active" : "inactive"
        };
    }


}

export default new PaymentProviderService();