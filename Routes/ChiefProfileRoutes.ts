import express from "express";
import ShopOwnerProfileControllers from "../Controllers/ChiefProfileControllers.ts";

const router = express.Router();

// -----------------------------
// Public or protected routes
// -----------------------------

// Create a new Chief Profile (protected, admin only)
router.post("/", ShopOwnerProfileControllers.create);

// Get all profiles (protected, maybe only Admin or Manager)
router.get("/", ShopOwnerProfileControllers.getAll);

// Get all profiles for a specific user by auth_id (multi-shop support)
router.get("/by-auth/:authId", ShopOwnerProfileControllers.getByAuthId);

// Get profile by ID (protected, anyone logged in can view)
router.get("/:id", ShopOwnerProfileControllers.getById);

// Update profile by ID (protected, only Admin)
router.put("/:id", ShopOwnerProfileControllers.update);

// Delete profile by ID (protected, only Admin)
router.delete("/:id", ShopOwnerProfileControllers.delete);

// Verify a profile (protected, only Admin)
router.patch("/:id/verify", ShopOwnerProfileControllers.verify);

// Get all verification steps status
router.get("/:id/verification-steps", ShopOwnerProfileControllers.getVerificationSteps);

// Verify a specific step status
router.patch("/:id/verify-step", ShopOwnerProfileControllers.verifyStep);

// Upload health certificate URL
router.patch("/:id/commercial-register", ShopOwnerProfileControllers.uploadCommercialRegister);

// Upload payment method
router.patch("/:id/payment-method", ShopOwnerProfileControllers.uploadPaymentMethod);

// Upload national ID images
router.patch("/:id/national-id", ShopOwnerProfileControllers.uploadNationalId);

// ── Jewar shop onboarding steps ──

// Shop info step: shop name + cover image (+ category type)
router.patch("/:id/shop-info", ShopOwnerProfileControllers.updateShopInfo);

// Address step: shop address
router.patch("/:id/shop-address", ShopOwnerProfileControllers.updateShopAddress);

// Tax record image step
router.patch("/:id/tax-record", ShopOwnerProfileControllers.uploadTaxRecord);

// Tax card image step
router.patch("/:id/tax-card", ShopOwnerProfileControllers.uploadTaxCard);

// Submit completed verification for admin review
router.patch("/:id/submit-verification", ShopOwnerProfileControllers.submitForReview);

// Admin: get all orders for analytics/dashboard
router.get("/order/admin/all", ShopOwnerProfileControllers.getAllOrders);

// Admin: get all chiefs pending review
router.get("/admin/pending-verifications", ShopOwnerProfileControllers.getPendingVerifications);

// Admin: approve a chief's verification
router.patch("/:id/approve-verification", ShopOwnerProfileControllers.approveVerification);

// Admin: reject a chief's verification
router.patch("/:id/reject-verification", ShopOwnerProfileControllers.rejectVerification);

// Admin: reject specific verification steps (wrong details → owner resends)
router.patch("/:id/reject-steps", ShopOwnerProfileControllers.rejectSteps);

// Chef: toggle kitchen open/closed
router.patch("/:id/shop-status", ShopOwnerProfileControllers.setShopStatus);

// â”€â”€ Order Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Create a new order (customer checkout)
router.post("/order", ShopOwnerProfileControllers.createOrder);

// Get all orders for a chef
router.get("/order/chef/:chefId", ShopOwnerProfileControllers.getChefOrders);

// Get all orders for a customer
router.get("/order/customer/:customerId", ShopOwnerProfileControllers.getCustomerOrders);

// Get a single order by ID
router.get("/order/:id", ShopOwnerProfileControllers.getOrderById);

// Update order fields (total, payment_image, etc.)
router.patch("/order/:id", ShopOwnerProfileControllers.updateOrder);

// Admin: verify/reject payment for an order
router.patch("/order/:id/payment-verify", ShopOwnerProfileControllers.verifyPayment);

// Shop owner: verify/reject a CUSTOMER's payment receipt for their order
router.patch("/order/:id/shop-payment-verify", ShopOwnerProfileControllers.shopVerifyPayment);

// Chef: accept an order
router.patch("/order/:id/accept", ShopOwnerProfileControllers.acceptOrder);

// Chef: update order status (preparing / ready / completed / cancelled)
router.patch("/order/:id/status", ShopOwnerProfileControllers.updateOrderStatus);

// Driver: update delivery step (accepted / picked_up / in_transit / delivered)
router.patch("/order/:id/delivery-step", ShopOwnerProfileControllers.updateDeliveryStep);

// Chef: get earnings summary (completed orders, 10% fee)
router.get("/order/chef/:chefId/earnings", ShopOwnerProfileControllers.getChefEarnings);

// Admin: get all orders pending payment verification
router.get("/admin/pending-payments", ShopOwnerProfileControllers.getPendingPayments);

// Admin: settle chief earnings
router.patch("/admin/settle-earnings/chef/:id", ShopOwnerProfileControllers.settleChefEarnings);

// â”€â”€ Driver Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// Driver: get available orders
router.get("/order/available/driver", ShopOwnerProfileControllers.getAvailableOrdersForDriver);

// Driver: get my orders
router.get("/order/driver/:driverId", ShopOwnerProfileControllers.getDriverOrders);

// Driver: accept an order
router.patch("/order/:id/driver-accept", ShopOwnerProfileControllers.acceptOrderDriver);

// Driver: propose a negotiable delivery price (Uber-style)
router.patch("/order/:id/delivery-offer", ShopOwnerProfileControllers.proposeDeliveryOffer);

// Customer: accept/reject a driver's delivery offer
router.patch("/order/:id/delivery-offer/respond", ShopOwnerProfileControllers.respondDeliveryOffer);

// Driver: deliver an order
router.patch("/order/:id/driver-deliver", ShopOwnerProfileControllers.deliverOrderDriver);

// Driver: report handing the collected cash delivery fee to the shop
router.patch("/order/:id/driver-cash-handoff", ShopOwnerProfileControllers.driverCashHandoff);

// Driver: report an online transfer to the shop with a receipt image
router.patch("/order/:id/driver-online-transfer", ShopOwnerProfileControllers.driverOnlineTransfer);

// Shop: confirm receipt of the driver's cash handoff or online transfer
router.patch("/order/:id/shop-confirm-payment", ShopOwnerProfileControllers.shopConfirmDriverPayment);


// Customer: rate order and driver after completion
router.post("/order/:id/rate", ShopOwnerProfileControllers.rateOrder);

// ── Advertising ──────────────────────────────────────────────

// Shop owner: create an ad (image uploaded via Image-Service first)
router.post("/ad", ShopOwnerProfileControllers.createAd);

// Customer app: all active ads
router.get("/ads/active", ShopOwnerProfileControllers.getActiveAds);

// Dashboard: my ads
router.get("/ad/owner/:ownerId", ShopOwnerProfileControllers.getAdsByOwner);

// Update ad (swap image, title, active toggle)
router.patch("/ad/:id", ShopOwnerProfileControllers.updateAd);

// Delete ad
router.delete("/ad/:id", ShopOwnerProfileControllers.deleteAd);

// ── Platform Config ──────────────────────────────────────
router.get("/config", ShopOwnerProfileControllers.getConfig);
router.patch("/config", ShopOwnerProfileControllers.updateConfig);

export default router;

