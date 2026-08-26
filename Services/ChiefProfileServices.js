import ShopOwnerProfileSchema from "../Models/ShopOwnerProfileSchema.js";
import OrderSchema from "../Models/OrderSchema.js";
import AdSchema from "../Models/AdSchema.js";
import PlatformConfigSchema from "../Models/PlatformConfigSchema.js";
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
    "Payment_Method_Status",
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

    // 5️⃣ Delete profile by ID
    async deleteProfile(profileId) {
        try {
            const profile = await ShopOwnerProfileSchema.findById(profileId);
            if (!profile) throw new Error("Profile not found");

            const db = mongoose.connection.db;

            const IMAGES_SVC = process.env.IMAGES_SERVICE_URL || "https://jewarimage-services-production.up.railway.app/api/v2/images";
            async function deleteUrl(url) {
                if (!url) return;
                try {
                    await fetch(`${IMAGES_SVC}/delete-by-url`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url })
                    });
                } catch (_) {}
            }

            const sidStr = String(profileId);
            let sidOid = null;
            try { sidOid = new mongoose.Types.ObjectId(sidStr); } catch (_) {}
            const both = (field) => sidOid ? { $or: [{ [field]: sidStr }, { [field]: sidOid }] } : { [field]: sidStr };

            // Delete images (correct schema fields: National_ID_Front/Back,
            // Commercial_Register, Tax_Record, Tax_Card)
            const imageUrls = [
                profile.profile_image,
                profile.shop_cover,
                profile.National_ID_Front,
                profile.National_ID_Back,
                profile.Commercial_Register,
                profile.Tax_Record,
                profile.Tax_Card,
            ].filter(Boolean);

            // Dishes reference the shop via ObjectId Owner_id
            const dishMatch = { Owner_id: sidOid || sidStr };
            const dishes = await db.collection('dishes').find(dishMatch, { projection: { image: 1 } }).toArray();
            for (const d of dishes) if (d.image) imageUrls.push(d.image);

            const ads = await db.collection('ads').find(both('owner_id'), { projection: { image_url: 1 } }).toArray();
            for (const a of ads) if (a.image_url) imageUrls.push(a.image_url);

            for (const url of imageUrls) await deleteUrl(url);

            // Drop related data
            await db.collection('dishes').deleteMany(dishMatch);
            await db.collection('ads').deleteMany(both('owner_id'));
            await db.collection('preferreddishchiefs').deleteMany(both('chief_id'));
            await db.collection('dailydishavailabilities').deleteMany(both('chief_id'));
            await db.collection('orders').deleteMany(both('chef_id'));
            // Do NOT delete the user account — user deletion belongs to User-Service cascade delete.
            await db.collection('addresses').deleteMany({ Profile_id: new mongoose.Types.ObjectId(sidStr) });
            await ShopOwnerProfileSchema.findByIdAndDelete(profileId);

            return { status: "success", message: "Profile and all related data deleted successfully" };
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

    // Reject specific verification steps (admin marks wrong details so the
    // shop owner has to resend them)
    async rejectSteps(profileId, steps, reason) {
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
            if (!Array.isArray(steps) || steps.length === 0) {
                throw new Error("steps array is required");
            }
            const invalid = steps.filter((s) => !validSteps.includes(s));
            if (invalid.length > 0) {
                throw new Error(`Invalid steps: ${invalid.join(", ")}`);
            }
            const update = { Verification_Status: "rejected" };
            steps.forEach((s) => { update[s] = "rejected"; });
            if (reason) update.Rejection_Reason = reason;
            const updated = await ShopOwnerProfileSchema.findByIdAndUpdate(
                profileId,
                update,
                { new: true }
            );
            if (!updated) throw new Error("Profile not found");
            return { status: "success", profile: updated };
        } catch (error) {
            throw new Error(error.message || "Failed to reject steps");
        }
    }

  // â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�â•�
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

  async updateOrder(orderId, data) {
    try {
      const allowed = ["total", "payment_image", "payment_method", "delivery_fee"];
      const update = {};
      for (const key of allowed) {
        if (data[key] !== undefined) update[key] = data[key];
      }
      const order = await OrderSchema.findByIdAndUpdate(orderId, update, { new: true });
      if (!order) throw new Error("Order not found");
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to update order");
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
      const config = await PlatformConfigSchema.getConfig();
      const appFeePercent = config.app_fee_percent ?? 10;

      const orders = await OrderSchema.find({
        chef_id: chefId,
        transaction_status: "approved",
        order_status: "completed",
      }).sort({ createdAt: -1 });

      const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
      const appFee = totalRevenue * (appFeePercent / 100);
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
      const weekFee = weekRevenue * (appFeePercent / 100);
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
  
  async getAvailableOrdersForDriver(driverId) {
    try {
      // Only online + verified drivers may see the order pool.
      let driverRating = 0;
      let driverCity = null;
      if (driverId) {
        let eligible = true;
        try {
          const dRes = await fetch(`${DRIVER_SERVICE_URL}/${driverId}`, { headers: { "Content-Type": "application/json" } });
          if (dRes.ok) {
            const dData = await dRes.json();
            const driver = dData.profile || dData.driver || dData;
            if (!driver.online_status || !driver.Is_Verified) eligible = false;
            driverRating = driver.rating || 0;
            // Extract driver city from payment_method or use current_location city lookup
            // We'll use the driver's location to filter orders by matching delivery_address.city
            if (driver.current_location) {
              // We'll filter after enrichment instead of at query level
            }
          } else {
            eligible = false;
          }
        } catch (_) { eligible = false; }
        if (!eligible) return { status: "success", orders: [] };
      }

      // Rating-based priority: top drivers (rating >= 4.0) see the full order pool
      // immediately, while lower-rated drivers only see orders older than 30 seconds,
      // giving high-rated drivers a head start on new orders.
      const baseQuery = { order_status: "ready", $or: [{ driver_id: { $exists: false } }, { driver_id: null }] };
      if (driverRating < 4) {
        const cutoff = new Date(Date.now() - 30 * 1000);
        baseQuery.createdAt = { $lte: cutoff };
      }

      // City filtering: fetch driver's primary address to determine city
      if (driverId && !driverCity) {
        try {
          const addrRes = await fetch(`${ADDRESS_SERVICE_URL}/?Profile_id=${driverId}`, { headers: { "Content-Type": "application/json" } });
          if (addrRes.ok) {
            const addrData = await addrRes.json();
            const addresses = addrData.addresses || addrData.data || [];
            const primary = addresses.find((a) => a.is_primary) || addresses[0];
            if (primary) driverCity = primary.city || primary.governorate || null;
          }
        } catch (_) {}
      }

      const orders = await OrderSchema.find(baseQuery).sort({ createdAt: -1 });
      let enriched = await Promise.all(orders.map(async (order) => {
        const o = order.toObject();
        // Enrich chef details
        if (o.chef_id) {
          const chef = await ShopOwnerProfileSchema.findById(o.chef_id).select("name phone shop_address profile_image shop_cover");
          if (chef) {
            o.chef_name = chef.name;
            o.chef_phone = chef.phone;
            o.chef_address = chef.shop_address || "";
            o.chef_image = chef.shop_cover || chef.profile_image || "";
            // Extract chef city from shop_address
            if (chef.shop_address && !o.chef_city) {
              const addrParts = (typeof chef.shop_address === "string" ? chef.shop_address : "").split(",");
              o.chef_city = addrParts.length > 1 ? addrParts[addrParts.length - 1].trim() : null;
            }
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

      // City-based filtering: only show orders whose delivery address city matches driver's city
      if (driverCity) {
        const normalizedDriverCity = driverCity.toLowerCase().trim();
        enriched = enriched.filter((o) => {
          const orderCity = (o.delivery_address?.city || "").toLowerCase().trim();
          const chefCity = (o.chef_city || "").toLowerCase().trim();
          // Show order if it matches driver's city OR chef is in driver's city
          return orderCity === normalizedDriverCity || chefCity === normalizedDriverCity;
        });
      }

      return { status: "success", orders: enriched };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch available orders for driver");
    }
  }

  async acceptOrderDriver(orderId, driverId) {
    try {
      // Reject offline / unverified drivers.
      if (driverId) {
        try {
          const dRes = await fetch(`${DRIVER_SERVICE_URL}/${driverId}`, { headers: { "Content-Type": "application/json" } });
          if (dRes.ok) {
            const dData = await dRes.json();
            const driver = dData.profile || dData.driver || dData;
            if (!driver.online_status || !driver.Is_Verified) {
              throw new Error("Go online and complete account activation to accept orders");
            }
          }
        } catch (e) {
          if (e && e.message && e.message.includes("activation")) throw e;
        }
      }
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

  // Uber-style negotiable delivery fee ─────────────────────────────

  async proposeDeliveryOffer(orderId, driverId, driverName, amount) {
    try {
      if (!driverId) throw new Error("driver_id is required");
      const price = Number(amount);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid offer amount");

      // Driver must be online + verified to bid.
      try {
        const dRes = await fetch(`${DRIVER_SERVICE_URL}/${driverId}`, { headers: { "Content-Type": "application/json" } });
        if (dRes.ok) {
          const dData = await dRes.json();
          const driver = dData.profile || dData.driver || dData;
          if (!driver.online_status || !driver.Is_Verified) {
            throw new Error("Go online and complete account activation to send offers");
          }
        }
      } catch (e) {
        if (e && e.message && e.message.includes("activation")) throw e;
      }

      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.driver_id) throw new Error("Order already has a driver");
      if (!["ready", "preparing", "accepted"].includes(order.order_status)) {
        throw new Error("Order is not open for offers");
      }
      order.delivery_offers = (order.delivery_offers || []).filter(
        (o) => o.status === "proposed" && String(o.driver_id) !== String(driverId)
      );
      order.delivery_offers.push({
        driver_id: String(driverId),
        driver_name: driverName || "Driver",
        amount: price,
        status: "proposed",
        created_at: new Date(),
      });
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to send offer");
    }
  }

  async respondDeliveryOffer(orderId, offerId, accept) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      const offer = (order.delivery_offers || []).id(offerId);
      if (!offer) throw new Error("Offer not found");
      if (offer.status !== "proposed") throw new Error("Offer already answered");
      if (order.driver_id) throw new Error("Order already has a driver");

      if (accept) {
        for (const o of order.delivery_offers) {
          o.status = o._id.toString() === offerId ? "accepted" : "rejected";
        }
        order.driver_id = offer.driver_id;
        order.agreed_delivery_fee = offer.amount;
        order.order_status = "out_for_delivery";
      } else {
        offer.status = "rejected";
      }
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to respond to offer");
    }
  }

  async getDriverOrders(driverId) {
    try {
      const orders = await OrderSchema.find({ driver_id: driverId }).sort({ createdAt: -1 });
      const enriched = await Promise.all(orders.map(async (order) => {
        const o = order.toObject();
        if (o.chef_id) {
          try {
            const chef = await ShopOwnerProfileSchema.findById(o.chef_id).select("name phone shop_address profile_image shop_cover");
            if (chef) {
              o.chef_name = chef.name;
              o.chef_phone = chef.phone;
              o.chef_address = chef.shop_address || "";
              o.chef_image = chef.shop_cover || chef.profile_image || "";
            }
          } catch (_) {}
        }
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
      throw new Error(error.message || "Failed to fetch driver orders");
    }
  }

  async deliverOrderDriver(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.order_status === "completed") throw new Error("Order already completed");
      
      // Fetch platform config for fee calculations.
      const config = await PlatformConfigSchema.getConfig();
      const appFeePercent = config.app_fee_percent ?? 10;
      const defaultDeliveryFee = config.default_delivery_fee ?? 15;

      // Use the negotiated delivery fee if available, otherwise the default.
      const driverFee = order.agreed_delivery_fee ?? order.delivery_fee ?? defaultDeliveryFee;

      // Apply the app fee percentage on the food total.
      const appFee = order.total * (appFeePercent / 100);
      const chefEarnings = order.total - appFee;

      order.order_status = "completed";
      order.delivery_fee = driverFee;
      await order.save();

      // Update chef earnings
      if (order.chef_id) {
         const chef = await ShopOwnerProfileSchema.findById(order.chef_id);
         if (chef) {
             if(!chef.earnings) chef.earnings = { total: 0, this_week: 0, pending: 0 };
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
               body: JSON.stringify({ amount: driverFee })
            });
         } catch (_) {}
      }

      return { status: "success", order, breakdown: { foodTotal: order.total, appFee, driverFee, chefEarnings } };
    } catch (error) {
      throw new Error(error.message || "Failed to deliver order");
    }
  }

  async updateDeliveryStep(orderId, driverId, step) {
    try {
      const validSteps = ["accepted", "picked_up", "in_transit", "delivered"];
      if (!validSteps.includes(step)) throw new Error("Invalid delivery step");

      const order = await OrderSchema.findOne({ _id: orderId, driver_id: driverId });
      if (!order) throw new Error("Order not found or not assigned to this driver");

      order.delivery_step = step;
      if (step === "delivered") {
        order.order_status = "completed";
      }
      await order.save();

      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to update delivery step");
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

  // ── Advertising ──────────────────────────────────────────────

  async createAd(data) {
    try {
      const ad = await AdSchema.create(data);
      return { status: "success", ad };
    } catch (error) {
      throw new Error(error.message || "Failed to create ad");
    }
  }

  async getActiveAds() {
    try {
      const ads = await AdSchema.find({ active: true })
        .sort({ createdAt: -1 })
        .limit(20);
      return { status: "success", ads };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch ads");
    }
  }

  async getAdsByOwner(ownerId) {
    try {
      const ads = await AdSchema.find({ owner_id: ownerId }).sort({ createdAt: -1 });
      return { status: "success", ads };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch owner ads");
    }
  }

  async updateAd(id, data) {
    try {
      const allowed = ["image_url", "title", "subtitle", "active"];
      const updates = {};
      for (const key of allowed) if (data[key] !== undefined) updates[key] = data[key];
      const ad = await AdSchema.findByIdAndUpdate(id, updates, { new: true });
      if (!ad) throw new Error("Ad not found");
      return { status: "success", ad };
    } catch (error) {
      throw new Error(error.message || "Failed to update ad");
    }
  }

  async deleteAd(id) {
    try {
      const ad = await AdSchema.findByIdAndDelete(id);
      if (!ad) throw new Error("Ad not found");
      return { status: "success" };
    } catch (error) {
      throw new Error(error.message || "Failed to delete ad");
    }
  }

}

export default new ChiefProfileService();

