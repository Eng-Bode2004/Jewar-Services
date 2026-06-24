import express from "express";
import ChiefProfileControllers from "../Controllers/ChiefProfileControllers.ts";

const router = express.Router();

// -----------------------------
// Public or protected routes
// -----------------------------

// Create a new Chief Profile (protected, admin only)
router.post("/", ChiefProfileControllers.create);

// Get all profiles (protected, maybe only Admin or Manager)
router.get("/", ChiefProfileControllers.getAll);

// Get profile by ID (protected, anyone logged in can view)
router.get("/:id", ChiefProfileControllers.getById);

// Update profile by ID (protected, only Admin)
router.put("/:id", ChiefProfileControllers.update);

// Delete profile by ID (protected, only Admin)
router.delete("/:id", ChiefProfileControllers.delete);

// Verify a profile (protected, only Admin)
router.patch("/:id/verify", ChiefProfileControllers.verify);

// Get all verification steps status
router.get("/:id/verification-steps", ChiefProfileControllers.getVerificationSteps);

// Verify a specific step status
router.patch("/:id/verify-step", ChiefProfileControllers.verifyStep);

// Upload health certificate URL
router.patch("/:id/health-certificate", ChiefProfileControllers.uploadHealthCertificate);

// Upload payment method
router.patch("/:id/payment-method", ChiefProfileControllers.uploadPaymentMethod);

// Upload national ID images
router.patch("/:id/national-id", ChiefProfileControllers.uploadNationalId);

// Submit completed verification for admin review
router.patch("/:id/submit-verification", ChiefProfileControllers.submitForReview);

// Admin: get all chiefs pending review
router.get("/admin/pending-verifications", ChiefProfileControllers.getPendingVerifications);

// Admin: approve a chief's verification
router.patch("/:id/approve-verification", ChiefProfileControllers.approveVerification);

// Admin: reject a chief's verification
router.patch("/:id/reject-verification", ChiefProfileControllers.rejectVerification);

// Chef: toggle kitchen open/closed
router.patch("/:id/kitchen-status", ChiefProfileControllers.setKitchenStatus);

// ── Order Management ─────────────────────────────────────────────────────

// Create a new order (customer checkout)
router.post("/order", ChiefProfileControllers.createOrder);

// Get all orders for a chef
router.get("/order/chef/:chefId", ChiefProfileControllers.getChefOrders);

// Get all orders for a customer
router.get("/order/customer/:customerId", ChiefProfileControllers.getCustomerOrders);

// Get a single order by ID
router.get("/order/:id", ChiefProfileControllers.getOrderById);

// Admin: verify/reject payment for an order
router.patch("/order/:id/payment-verify", ChiefProfileControllers.verifyPayment);

// Chef: accept an order
router.patch("/order/:id/accept", ChiefProfileControllers.acceptOrder);

// Chef: update order status (preparing / ready / completed / cancelled)
router.patch("/order/:id/status", ChiefProfileControllers.updateOrderStatus);

// Chef: get earnings summary (completed orders, 10% fee)
router.get("/order/chef/:chefId/earnings", ChiefProfileControllers.getChefEarnings);

// Admin: get all orders pending payment verification
router.get("/admin/pending-payments", ChiefProfileControllers.getPendingPayments);

// Admin: settle chief earnings
router.patch("/admin/settle-earnings/chef/:id", ChiefProfileControllers.settleChefEarnings);

// ── Driver Orders ────────────────────────────────────────────────────────

// Driver: get available orders
router.get("/order/available/driver", ChiefProfileControllers.getAvailableOrdersForDriver);

// Driver: get my orders
router.get("/order/driver/:driverId", ChiefProfileControllers.getDriverOrders);

// Driver: accept an order
router.patch("/order/:id/driver-accept", ChiefProfileControllers.acceptOrderDriver);

// Driver: deliver an order
router.patch("/order/:id/driver-deliver", ChiefProfileControllers.deliverOrderDriver);

// Customer: rate order and driver after completion
router.post("/order/:id/rate", ChiefProfileControllers.rateOrder);

export default router;
