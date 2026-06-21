import PaymentProviderServices from "../Services/PaymentProviderServices.js";

class PaymentProviderController {

    // ➤ Create
    async create(req, res) {
        try {
            const provider = await PaymentProviderServices.createProvider(req.body);
            res.status(201).json({ status: "success", data: provider });
        } catch (err) {
            res.status(400).json({ status: "error", message: err.message });
        }
    }

    // ➤ Get All
    async getAll(req, res) {
        try {
            const providers = await PaymentProviderServices.getAllProviders();
            res.json({ status: "success", data: providers });
        } catch (err) {
            res.status(500).json({ status: "error", message: err.message });
        }
    }

    // ➤ Update
    async update(req, res) {
        try {
            const { id } = req.params;
            const updated = await PaymentProviderServices.updateProvider(id, req.body);
            res.json({ status: "success", data: updated });
        } catch (err) {
            res.status(400).json({ status: "error", message: err.message });
        }
    }

    // ➤ Delete
    async delete(req, res) {
        try {
            const { id } = req.params;
            const result = await PaymentProviderServices.deleteProvider(id);
            res.json({ status: "success", data: result });
        } catch (err) {
            res.status(400).json({ status: "error", message: err.message });
        }
    }

    // ➤ Activate / Deactivate
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const provider = await PaymentProviderServices.toggleStatus(id, status);
            res.json({ status: "success", data: provider });
        } catch (err) {
            res.status(400).json({ status: "error", message: err.message });
        }
    }

    // ➤ Get Only Active Providers
    async getActive(req, res) {
        try {
            const providers = await PaymentProviderServices.getActiveProviders();
            res.json({ status: "success", data: providers });
        } catch (err) {
            res.status(500).json({ status: "error", message: err.message });
        }
    }

    // ➤ Get Provider by ID
    async getById(req, res) {
        try {
            const { id } = req.params;
            const provider = await PaymentProviderServices.getProviderById(id);
            res.json({ status: "success", data: provider });
        } catch (err) {
            res.status(400).json({ status: "error", message: err.message });
        }
    }


}

export default new PaymentProviderController();