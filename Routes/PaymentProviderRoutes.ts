import express from 'express';
const router = express.Router();
import PaymentProviderControllers from "../Controllers/PaymentProviderControllers";

// Create
router.post("/", PaymentProviderControllers.create);

// Get All
router.get("/", PaymentProviderControllers.getAll);

// Get Only Active Providers (MUST be before /:id)
router.get("/active", PaymentProviderControllers.getActive);

// Get Provider by ID
router.get("/:id", PaymentProviderControllers.getById);

// Update
router.put("/:id", PaymentProviderControllers.update);

// Delete
router.delete("/:id", PaymentProviderControllers.delete);

// Activate / Deactivate
router.patch("/status/:id", PaymentProviderControllers.toggleStatus);

export default router;
