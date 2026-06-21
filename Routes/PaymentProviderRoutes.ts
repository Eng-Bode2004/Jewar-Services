import express from 'express';
const router = express.Router();
import PaymentProviderControllers from "../Controllers/PaymentProviderControllers";

// Create
router.post("/", PaymentProviderControllers.create);

// Get All
router.get("/", PaymentProviderControllers.getAll);

// Update
router.put("/:id", PaymentProviderControllers.update);

// Delete
router.delete("/:id", PaymentProviderControllers.delete);

// Activate / Deactivate
router.patch("/status/:id", PaymentProviderControllers.toggleStatus);

// Get Only Active Providers
router.get("/active", PaymentProviderControllers.getActive);

// Get Provider by ID
router.get("/:id", PaymentProviderControllers.getById);

export default router;
