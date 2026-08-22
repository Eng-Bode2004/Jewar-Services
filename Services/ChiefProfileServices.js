import ShopOwnerProfileSchema from "../Models/ShopOwnerProfileSchema.js";
import OrderSchema from "../Models/OrderSchema.js";
import mongoose from "mongoose";

const DailyDishAvailabilitySchema = new mongoose.Schema({
    chief_id: { type: mongoose.Schema.Types.ObjectId, ref: "Chief Profile", required: true },
    dish_id: { type: mongoose.Schema.Types.ObjectId, ref: "Dish", required: true },
    date: { type: String, required: true },
    pieces_available: { type: Number, required: true, min: 0 },
    pieces_sold: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
DailyDishAvailabilitySchema.index({ chief_id: 1, dish_id: 1, date: 1 }, { unique: true });
const DailyDishAvailability = mongoose.models.DailyDishAvailability ||
    mongoose.model("DailyDishAvailability", DailyDishAvailabilitySchema);

// ── Cross-service URLs (env-overridable, defaults point at production) ──
const ADDRESS_SERVICE_URL = process.env.ADDRESS_SERVICE_URL || "https://jewaraddress-services-production.up.railway.app/api/v1/address";
const PREFERRED_DISHES_SERVICE_URL = process.env.PREFERRED_DISHES_SERVICE_URL || "https://jewardishprefered-services-production.up.railway.app/api/v1/preferred-dishes-chief";
const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || "https://jewarcustomerprofile-services-production.up.railway.app/api/v1/customer-profile";
const DRIVER_SERVICE_URL = process.env.DRIVER_SERVICE_URL || "https://jewardriverprofile-services-production.up.railway.app/api/v2/driver-profile";

// Steps that must be verified before a shop can submit for review
const REQUIRED_VERIFICATION_STEPS = [
    "Address_Status",
    "Shop_Info_Status",
    "National_ID_Status",
    "Tax_Record_Status",
    "Tax_Card_Status",
];

class ChiefProfileService {

    // 1ï¸âƒ£ Create a new Chief Profile
    async createProfile(data) {
        try {
            const profile = await ShopOwnerProfileSchema.create(data);
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to create Chief Profile");
        }
    }

    // 2ï¸âƒ£ Get a profile by ID
    async getProfileById(profileId) {
        try {
            const profile = await ShopOwnerProfileSchema.findById(profileId)
            if (!profile) throw new Error("Profile not found");
            return { status: "success", profile };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch Chief Profile");
        }
    }

    // 3ï¸âƒ£ Get all profiles with optional filters (enriched with address + preferred dishes)
    async getAllProfiles(filter = {}) {
        try {
            const profiles = await ShopOwnerProfileSchema.find(filter)
            const enriched = await Promise.all(profiles.map(async (p) => {
                const doc = p.toObject ? p.toObject() : { ...p };
                const id = doc._id?.toString();
                if (!id) return doc;
                // fetch address
                try {
                    const addrRes = await fetch(`${ADDRESS_SERVICE_URL}/?Profile_id=${id}`);
                    if (addrRes.ok) {
                        const addrData = await addrRes.json();
                        const addrs = addrData?.addresses ?? [];
                        if (addrs.length > 0) doc.address = addrs[0];
                    }
                } catch { /* address unavailable */ }
                // fetch preferred dishes
                try {
                    const prefRes = await fetch(`${PREFERRED_DISHES_SERVICE_URL}/preferred/${id}`);
                    if (prefRes.ok) {
                        const prefData = await prefRes.json();
                        doc.preferredDishes = prefData?.preferred ?? [];
                    } else {
                        doc.preferredDishes = [];
                    }
                } catch { doc.preferredDishes = []; }
                return doc;
            }));
            return { status: "success", profiles: enriched };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch profiles");
        }
    }

    // 4ï¸âƒ£ Update profile by ID
    async updateProfile(profileId, updateData) {
        try {
            const updatedProfile = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                updateData,
                { new: true }
            );
            if (!updatedProfile) throw new Error("Profile not found");
            return { status: "success", updatedProfile };
        } catch (error) {
            throw new Error(error.message || "Failed to update profile");
        }
    }

    // 5ï¸âƒ£ Delete profile by ID
    async deleteProfile(profileId) {
        try {
            const deleted = await ShopOwnerProfileSchema.findByIdAndDelete(profileId);
            if (!deleted) throw new Error("Profile not found");
            return { status: "success", message: "Profile deleted successfully" };
        } catch (error) {
            throw new Error(error.message || "Failed to delete profile");
        }
    }

    // 6ï¸âƒ£ Verify profile (set Is_Verified = true)
    async verifyProfile(profileId) {
        try {
            const verifiedProfile = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                { Is_Verified: true },
                { new: true }
            );
            if (!verifiedProfile) throw new Error("Profile not found");
            return { status: "success", verifiedProfile };
        } catch (error) {
            throw new Error(error.message || "Failed to verify profile");
        }
    }

    // 7ï¸âƒ£ Verify a specific step by field name
    async verifyStep(profileId, step, status) {
        try {
        const validSteps = [
                "Products_Status",
                "Address_Status",
                "Payment_Method_Status",
                "Commercial_Register_Status",
                "National_ID_Status",
                "Shop_Info_Status",
                "Tax_Record_Status",
                "Tax_Card_Status",
            ];
            if (!validSteps.includes(step)) {
                throw new Error(`Invalid step: ${step}. Must be one of: ${validSteps.join(", ")}`);
            }
            const validStatuses = ["pending", "in_progress", "verified", "rejected"];
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
            }
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                { [step]: status },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to verify step");
        }
    }

    // 8ï¸âƒ£ Get verification steps status
    async getVerificationSteps(profileId) {
        try {
            const profile = await ShopOwnerProfileSchema.findById(profileId).select(
                "Products_Status Address_Status Payment_Method_Status Commercial_Register_Status National_ID_Status Shop_Info_Status Tax_Record_Status Tax_Card_Status Is_Verified Verification_Status Rejection_Reason"
            );
            if (!profile) throw new Error("Profile not found");
            return { status: "success", steps: profile };
        } catch (error) {
            throw new Error(error.message || "Failed to get verification steps");
        }
    }

    // 9ï¸âƒ£ Upload health certificate (store URL)
    async uploadCommercialRegister(profileId, certificateUrl) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Commercial_Register: certificateUrl,
                    Commercial_Register_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload health certificate");
        }
    }

    // ðŸ”Ÿ Upload payment method
    async uploadPaymentMethod(profileId, { provider, details }) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Payment_Method: { provider, details },
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload payment method");
        }
    }

    // 1ï¸âƒ£1ï¸âƒ£ Upload national ID images
    async uploadNationalId(profileId, frontImageURL, backImageURL) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    National_ID_Front: frontImageURL,
                    National_ID_Back: backImageURL,
                    National_ID_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload national ID");
        }
    }

    // ── Jewar shop onboarding steps ──

    // Shop info step: shop name (+ optional cover image and category type)
    async updateShopInfo(profileId, { name, shop_cover, Category_id, Subcategory_id }) {
        try {
            const updateFields = { Shop_Info_Status: "in_progress" };
            if (name && String(name).trim()) updateFields.name = String(name).trim();
            if (shop_cover) updateFields.shop_cover = shop_cover;
            if (Category_id) updateFields.Category_id = Category_id;
            if (Subcategory_id) updateFields.Subcategory_id = Subcategory_id;

            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                updateFields,
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to update shop info");
        }
    }

    // Address step
    async updateShopAddress(profileId, shop_address) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    shop_address,
                    Address_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to update shop address");
        }
    }

    // Tax record image step
    async uploadTaxRecord(profileId, taxRecordUrl) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Tax_Record: taxRecordUrl,
                    Tax_Record_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload tax record");
        }
    }

    // Tax card image step
    async uploadTaxCard(profileId, taxCardUrl) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Tax_Card: taxCardUrl,
                    Tax_Card_Status: "in_progress",
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to upload tax card");
        }
    }

    // 1ï¸âƒ£2ï¸âƒ£ Submit for admin review (shop owner calls this after all steps verified)
    async submitForReview(profileId) {
        try {
            const profile = await ShopOwnerProfileSchema.findById(profileId);
            if (!profile) throw new Error("Profile not found");

            const pending = REQUIRED_VERIFICATION_STEPS.filter(s => profile[s] !== "verified");
            if (pending.length > 0) {
                throw new Error(`Cannot submit: incomplete steps: ${pending.join(", ")}`);
            }

            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                { Verification_Status: "pending_review" },
                { new: true }
            );
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to submit for review");
        }
    }

    // 1ï¸âƒ£3ï¸âƒ£ Get all chiefs pending admin review (includes address + preferred dishes)
    async getPendingVerifications() {
        try {
            const profiles = await ShopOwnerProfileSchema.find({
                Verification_Status: "pending_review",
            });
            // enrich each profile with address and preferred dishes
            const enriched = await Promise.all(profiles.map(async (p) => {
                const doc = p.toObject();
                // fetch address from Address-Services
                try {
                    const addrRes = await fetch(`${ADDRESS_SERVICE_URL}/?Profile_id=${doc._id}`);
                    if (addrRes.ok) {
                        const addrData = await addrRes.json();
                        const addrs = addrData?.addresses ?? [];
                        if (addrs.length > 0) {
                            doc.address = addrs[0];
                        }
                    }
                } catch {
                    // address unavailable
                }
                // fetch preferred dishes from PreferredDishChief-Services
                try {
                    const prefRes = await fetch(`${PREFERRED_DISHES_SERVICE_URL}/preferred/${doc._id}`);
                    if (prefRes.ok) {
                        const prefData = await prefRes.json();
                        doc.preferredDishes = prefData?.preferred ?? [];
                    } else {
                        doc.preferredDishes = [];
                    }
                } catch {
                    doc.preferredDishes = [];
                }
                return doc;
            }));
            return { status: "success", profiles: enriched };
        } catch (error) {
            throw new Error(error.message || "Failed to fetch pending verifications");
        }
    }

    // 1ï¸âƒ£4ï¸âƒ£ Approve verification (admin action)
    async approveVerification(profileId) {
        try {
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                {
                    Verification_Status: "approved",
                    Is_Verified: true,
                },
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to approve verification");
        }
    }

    // 1ï¸âƒ£5ï¸âƒ£ Reject verification (admin action)
    async rejectVerification(profileId, rejectionReason) {
        try {
            const updateFields = { Verification_Status: "rejected" };
            if (rejectionReason) {
                updateFields.Rejection_Reason = rejectionReason;
            }
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                updateFields,
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to reject verification");
        }
    }

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ORDER MANAGEMENT
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  async createOrder(data) {
    try {
      const order = await OrderSchema.create(data);
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to create order");
    }
  }

  async getOrdersByChef(chefId) {
    try {
      const orders = await OrderSchema.find({ chef_id: chefId }).sort({ createdAt: -1 });
      return { status: "success", orders };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch chef orders");
    }
  }

  async getOrdersByCustomer(customerId) {
    try {
      const orders = await OrderSchema.find({ customer_id: customerId }).sort({ createdAt: -1 });
      return { status: "success", orders };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch customer orders");
    }
  }

  async getOrderById(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch order");
    }
  }

  async verifyPayment(orderId, status, bodyChefId) {
    try {
      if (!["approved", "rejected"].includes(status)) {
        throw new Error("Status must be 'approved' or 'rejected'");
      }
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");

      const update = { transaction_status: status };
      if (status === "rejected") {
        update.order_status = "cancelled";
      }

      // Auto-assign chef if order has none, items are present, and payment is approved
      if (status === "approved" && !order.chef_id && order.items?.length) {
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const dishIds = [...new Set(order.items.map(i => i.dish_id))];
        const availabilities = await DailyDishAvailability.find({ dish_id: { $in: dishIds }, date });
        const chefMap = new Map();
        for (const a of availabilities) {
          const cid = a.chief_id.toString();
          if (!chefMap.has(cid)) chefMap.set(cid, new Map());
          chefMap.get(cid).set(a.dish_id.toString(), { available: a.pieces_available, sold: a.pieces_sold });
        }

        // Filter out chefs whose kitchen is closed
        const chefIds = [...chefMap.keys()];
        const openChefs = await ShopOwnerProfileSchema.find({ _id: { $in: chefIds }, shop_open: { $ne: false } }).select("_id");
        const openIds = new Set(openChefs.map(c => c._id.toString()));
        for (const cid of chefIds) {
          if (!openIds.has(cid)) chefMap.delete(cid);
        }

        let bestChef = null;
        let bestScore = -1;
        for (const [cid, dishMap] of chefMap) {
          let canFulfill = true;
          let totalRemaining = 0;
          for (const item of order.items) {
            const stock = dishMap.get(item.dish_id);
            if (!stock) { canFulfill = false; break; }
            const remaining = stock.available - stock.sold;
            if (remaining < item.qty) { canFulfill = false; break; }
            totalRemaining += remaining;
          }
          if (canFulfill && totalRemaining > bestScore) {
            bestScore = totalRemaining;
            bestChef = cid;
          }
        }
        if (bestChef) update.chef_id = bestChef;
      }

      // Fallback: use chef_id provided in request body if order still has none
      if (!order.chef_id && bodyChefId) {
        update.chef_id = bodyChefId;
      }

      const updated = await OrderSchema.findByIdAndUpdate(orderId, update, { new: true });
      return { status: "success", order: updated };
    } catch (error) {
      throw new Error(error.message || "Failed to verify payment");
    }
  }

  async acceptOrder(orderId) {
    try {
      const order = await OrderSchema.findByIdAndUpdate(
        orderId,
        { order_status: "accepted" },
        { new: true }
      );
      if (!order) throw new Error("Order not found");
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to accept order");
    }
  }

  async updateOrderStatus(orderId, orderStatus) {
    try {
      const valid = ["preparing", "ready", "completed", "cancelled"];
      if (!valid.includes(orderStatus)) {
        throw new Error(`Invalid status. Must be one of: ${valid.join(", ")}`);
      }
      const order = await OrderSchema.findByIdAndUpdate(
        orderId,
        { order_status: orderStatus },
        { new: true }
      );
      if (!order) throw new Error("Order not found");
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to update order status");
    }
  }

  async settleChefEarnings(chefId) {
    try {
      const chef = await ShopOwnerProfileSchema.findById(chefId);
      if (!chef) throw new Error("Chef not found");
      if (!chef.earnings) chef.earnings = { total: 0, this_week: 0, pending: 0 };
      
      chef.earnings.total += chef.earnings.pending;
      chef.earnings.pending = 0;
      await chef.save();

      return { status: "success", earnings: chef.earnings };
    } catch (error) {
      throw new Error(error.message || "Failed to settle chef earnings");
    }
  }

  async getPendingPayments() {
    try {
      const orders = await OrderSchema.find({ transaction_status: "pending" }).sort({ createdAt: -1 });
      return { status: "success", orders };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch pending payments");
    }
  }

  async getChefEarnings(chefId) {
    try {
      const orders = await OrderSchema.find({
        chef_id: chefId,
        transaction_status: "approved",
        order_status: "completed",
      }).sort({ createdAt: -1 });

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const appFee = totalRevenue * 0.1;
      const netEarnings = totalRevenue - appFee;

      const dailyTotals = {};
      for (const o of orders) {
        const d = o.createdAt ? new Date(o.createdAt) : new Date();
        const key = d.toLocaleDateString("en-US", { weekday: "short" });
        dailyTotals[key] = (dailyTotals[key] || 0) + (o.total || 0);
      }
      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const days = dayOrder.map((label) => {
        const maxVal = Math.max(...Object.values(dailyTotals), 1);
        return {
          dayLabel: label[0],
          percent: maxVal > 0 ? ((dailyTotals[label] || 0) / maxVal) * 100 : 0,
          highlighted: label === new Date().toLocaleDateString("en-US", { weekday: "short" }),
        };
      });

      const recent = orders.slice(0, 5).map((o) => ({
        orderId: o._id.toString().slice(-4).toUpperCase(),
        icon: "receipt",
        timeLabel: o.createdAt
          ? new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "",
        amount: o.total || 0,
      }));

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekOrders = orders.filter((o) => o.createdAt && new Date(o.createdAt) >= weekStart);
      const weekRevenue = weekOrders.reduce((s, o) => s + (o.total || 0), 0);
      const weekFee = weekRevenue * 0.1;
      const weekNet = weekRevenue - weekFee;
      const prevWeekOrders = orders.filter(
        (o) => o.createdAt && new Date(o.createdAt) < weekStart && new Date(o.createdAt) >= new Date(weekStart.getTime() - 7 * 86400000)
      );
      const prevWeekRevenue = prevWeekOrders.reduce((s, o) => s + (o.total || 0), 0);
      const changePercent = prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100 : 0;

      return {
        status: "success",
        earnings: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          appFee: Math.round(appFee * 100) / 100,
          netEarnings: Math.round(netEarnings * 100) / 100,
          orderCount: orders.length,
          weekNet: Math.round(weekNet * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          days,
          recent,
        },
      };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch chef earnings");
    }
  }

  async setShopStatus(profileId, shopOpen) {
    try {
      const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
        profileId,
        { shop_open: shopOpen },
        { new: true }
      );
      if (!updated) throw new Error("Profile not found");
      return { status: "success", shop_open: updated.shop_open };
    } catch (error) {
      throw new Error(error.message || "Failed to update kitchen status");
    }
  }

  // â”€â”€ Admin Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getAllOrders() {
    try {
      const orders = await OrderSchema.find({}).sort({ createdAt: -1 });
      const total = orders.length;
      const completed = orders.filter(o => o.order_status === "completed");
      const totalRevenue = completed.reduce((sum, o) => sum + (o.total || 0), 0);
      const statusCounts = {};
      orders.forEach(o => {
        statusCounts[o.order_status] = (statusCounts[o.order_status] || 0) + 1;
      });
      return { status: "success", orders, total, totalRevenue, statusCounts };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch all orders");
    }
  }

  // â”€â”€ Driver Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  
  async getAvailableOrdersForDriver() {
    try {
      const orders = await OrderSchema.find({ order_status: "ready", driver_id: { $exists: false } }).sort({ createdAt: -1 });
      const enriched = await Promise.all(orders.map(async (order) => {
        const o = order.toObject();
        // Enrich chef details
        if (o.chef_id) {
          const chef = await ShopOwnerProfileSchema.findById(o.chef_id).select("name phone shop_address profile_image shop_cover");
          if (chef) {
            o.chef_name = chef.name;
            o.chef_phone = chef.phone;
            o.chef_address = chef.shop_address || "";
            o.chef_image = chef.shop_cover || chef.profile_image || "";
          }
        }
        // Enrich customer details
        if (o.customer_id) {
          try {
            const custRes = await fetch(`${CUSTOMER_SERVICE_URL}/auth/${o.customer_id}`, {
              headers: { "Content-Type": "application/json" }
            });
            if (custRes.ok) {
              const custData = await custRes.json();
              const cust = custData.profile || custData.response || custData;
              o.customer_phone = cust.phone || "";
              o.customer_email = cust.email || "";
              o.customer_avatar = cust.avatar || "";
            }
          } catch (_) {}
        }
        return o;
      }));
      return { status: "success", orders: enriched };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch available orders for driver");
    }
  }

  async acceptOrderDriver(orderId, driverId) {
    try {
      const order = await OrderSchema.findOneAndUpdate(
        { _id: orderId, driver_id: { $exists: false }, order_status: "ready" },
        { driver_id: driverId, order_status: "out_for_delivery" },
        { new: true }
      );
      if (!order) throw new Error("Order not available or already accepted by another driver");
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to accept order for driver");
    }
  }

  async getDriverOrders(driverId) {
    try {
      const orders = await OrderSchema.find({ driver_id: driverId }).sort({ createdAt: -1 });
      return { status: "success", orders };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch driver orders");
    }
  }

  async deliverOrderDriver(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.order_status === "completed") throw new Error("Order already completed");
      
      order.order_status = "completed";
      await order.save();

      // Update chef earnings
      if (order.chef_id) {
         const chef = await ShopOwnerProfileSchema.findById(order.chef_id);
         if (chef) {
             if(!chef.earnings) chef.earnings = { total: 0, this_week: 0, pending: 0 };
             const chefEarnings = order.total - 15; // 15 is driver fee
             chef.earnings.pending += Math.max(0, chefEarnings);
             await chef.save();
         }
      }

      // Update driver earnings via API call
      if (order.driver_id) {
         try {
            await fetch(`${DRIVER_SERVICE_URL}/${order.driver_id}/earnings`, {
               method: "PATCH",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ amount: 15 })
            });
         } catch (_) {}
      }

      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to deliver order");
    }
  }

  async rateOrder(orderId, rating, driverRating, comment) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.order_status !== "completed") throw new Error("Order must be completed before rating");

      order.rating = rating;
      if (driverRating) order.driver_rating = driverRating;
      if (comment) order.review_comment = comment;
      await order.save();

      // Update driver rating via API
      if (driverRating && order.driver_id) {
        try {
          await fetch(`${DRIVER_SERVICE_URL}/${order.driver_id}/rating`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating: driverRating })
          });
        } catch (_) {}
      }

      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to rate order");
    }
  }

}

export default new ChiefProfileService();

