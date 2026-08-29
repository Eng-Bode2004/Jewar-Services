import ShopOwnerProfileSchema from "../Models/ShopOwnerProfileSchema.js";
import OrderSchema from "../Models/OrderSchema.js";
import AdSchema from "../Models/AdSchema.js";
import PlatformConfigSchema from "../Models/PlatformConfigSchema.js";
import ChatSchema from "../Models/ChatSchema.js";
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

// A delivery-request order that a customer created but never completed (no
// driver assigned, still pending) is considered abandoned once it is older
// than this timeout, and is auto-cancelled so it stops appearing in the
// driver pool and shop/customer order lists.
const PENDING_DELIVERY_TTL_MS = 30 * 60 * 1000;

// Fetch the primary saved AddressService location (lat/lng + full text) for a
// Profile_id. Used to give drivers the shop + customer coordinates and full
// text addresses so they can see both locations on a map in order details.
async function fetchAddressLocation(profileId) {
    if (!profileId) return null;
    try {
        const addrRes = await fetch(`${ADDRESS_SERVICE_URL}/?Profile_id=${profileId}`, { headers: { "Content-Type": "application/json" } });
        if (!addrRes.ok) return null;
        const addrData = await addrRes.json();
        const addrs = addrData?.addresses ?? addrData?.data ?? [];
        const primary = addrs.find((a) => a.is_primary) || addrs[0];
        if (!primary) return null;
        const lat = Number(primary.latitude);
        const lng = Number(primary.longitude);
        const parts = [
            primary.street,
            primary.building_Number,
            primary.city,
            primary.governorate,
        ].filter((p) => p && String(p).trim() !== "");
        return {
            latitude: Number.isFinite(lat) ? lat : null,
            longitude: Number.isFinite(lng) ? lng : null,
            full_text: parts.join(", "),
        };
    } catch (_) {
        return null;
    }
}

// Fetch a single enriched copy of an order for client UIs. Adds the contact
// details of every party (shop / customer / driver) plus full text addresses
// (via AddressService) so drivers, shop owners and customers can reach each
// other directly. Safe to call on toObject()-style order representations.
async function enrichOrderForClient(orderDoc) {
    const o = orderDoc && orderDoc.toObject ? orderDoc.toObject() : orderDoc;
    if (!o) return o;

    // ── Shop (chef) details ──────────────────────────────────────────
    if (o.chef_id) {
        try {
            const chef = await ShopOwnerProfileSchema.findById(o.chef_id)
                .select("name phone shop_address profile_image shop_cover Payment_Method");
            if (chef) {
                o.chef_name = chef.name;
                o.chef_phone = chef.phone || "";
                o.chef_address = chef.shop_address || "";
                o.chef_image = chef.shop_cover || chef.profile_image || "";
                if (chef.Payment_Method) {
                    o.chef_payment_method = {
                        provider: chef.Payment_Method.provider || "",
                        details: chef.Payment_Method.details || "",
                    };
                }
            }
        } catch (_) {}
    }

    // ── Customer details ─────────────────────────────────────────────
    if (o.customer_id) {
        try {
            const custRes = await fetch(`${CUSTOMER_SERVICE_URL}/auth/${o.customer_id}`, {
                headers: { "Content-Type": "application/json" }
            });
            if (custRes.ok) {
                const custData = await custRes.json();
                const cust = custData.profile || custData.response || custData;
                o.customer_name = cust.name || cust.full_name || "Customer";
                o.customer_phone = cust.phone || "";
                o.customer_email = cust.email || "";
                o.customer_avatar = cust.avatar || "";
              o.customer_profile_address = cust.address || "";
            }
        } catch (_) {}
    }

    // ── Driver details (after a driver is assigned) ──────────────────
    if (o.driver_id) {
        try {
            const dRes = await fetch(`${DRIVER_SERVICE_URL}/${o.driver_id}`, {
                headers: { "Content-Type": "application/json" }
            });
            if (dRes.ok) {
                const dData = await dRes.json();
                const driver = dData.profile || dData.driver || dData;
                o.driver_name = driver.name || driver.full_name || "Driver";
                o.driver_phone = driver.phone || driver.mobile || "";
                o.driver_avatar = driver.avatar || "";
            }
        } catch (_) {}
    }

    // ── Full text addresses (shop pickup + customer drop-off) ────────
    // The customer's drop-off must come from the address they actually typed
    // on THIS order (order.delivery_address) — a saved AddressService profile
    // may be different or missing entirely, so it's only a fallback (plus the
    // coordinates for the map).
    const da = o.delivery_address && typeof o.delivery_address === "object" ? o.delivery_address : null;
    const orderDeliveryParts = da
        ? [da.label, da.street, da.city, da.country]
            .filter((p) => p && String(p).trim() !== "")
        : [];
    o.order_delivery_address = orderDeliveryParts.length ? orderDeliveryParts.join(", ") : "";

    let customerFull = o.order_delivery_address;
    const [shopLoc, custLoc] = await Promise.all([
        o.chef_id ? fetchAddressLocation(o.chef_id) : Promise.resolve(null),
        o.customer_id ? fetchAddressLocation(o.customer_id) : Promise.resolve(null),
    ]);
    if (shopLoc) {
        o.shop_latitude = shopLoc.latitude;
        o.shop_longitude = shopLoc.longitude;
        o.shop_full_address = shopLoc.full_text || o.chef_address || "";
      } else {
        o.shop_full_address = o.chef_address || "";
      }
    if (custLoc) {
        o.customer_latitude = custLoc.latitude;
        o.customer_longitude = custLoc.longitude;
        if (!customerFull) customerFull = custLoc.full_text || o.customer_profile_address || o.delivery_address?.street || "";
      } else if (!customerFull) {
        customerFull = o.customer_profile_address || o.delivery_address?.street || "";
      }
    o.customer_full_address = customerFull;
    return o;
}

// Ensure the order's chat has a set of participants. Every role that touches an
// order must be a participant (customer / chef / driver) so that each side's
// per-user in-app chat popup poller (getChatsByUser) can find the chat — even
// before they open the chat screen. $addToSet + upsert keeps it idempotent.
async function upsertChatParticipants(orderId, participants) {
    if (!orderId) return;
    try {
        const filtered = (participants || []).filter((p) => p && p.id);
        if (filtered.length === 0) return;
        await ChatSchema.findOneAndUpdate(
            { order_id: orderId },
            {
                $setOnInsert: { order_id: orderId },
                $addToSet: { participants: { $each: filtered } },
            },
            { upsert: true, new: true }
        );
    } catch (_) {
        // Chat seeding is best-effort; never fail the order because of it.
    }
}

// ── Stock / shop-status / item-rating helpers (share the service's DB) ─────

function todayStr() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Throw unless the given shop is open and accepting orders.
async function assertShopOpen(chefId) {
    if (!chefId) return;
    const chef = await ShopOwnerProfileSchema.findById(chefId).select("shop_open");
    if (chef && chef.shop_open === false) {
        throw new Error("This shop is currently closed and cannot take orders");
    }
}

// Deduct the ordered quantities from the shop inventory:
//  - "daily" (food) items decrement that day's DailyDishAvailability.pieces_sold,
//  - regular inventory items decrement the Dish's stock_quantity and are marked
//    unavailable when they run out.
// Guarded by the order's stock_deducted flag so it only runs once.
async function deductOrderStock(order) {
    if (!order || order.stock_deducted || !Array.isArray(order.items) || order.items.length === 0) {
        return { status: "skipped" };
    }
    const db = mongoose.connection.db;
    const date = todayStr();
    const outOfStock = [];
    for (const item of order.items) {
        const qty = Number(item.qty) || 0;
        if (!item.dish_id || qty <= 0) continue;
        let dish = null;
        try {
            dish = await db.collection("dishes").findOne({ _id: mongoose.Types.ObjectId.isValid(item.dish_id) ? new mongoose.Types.ObjectId(item.dish_id) : item.dish_id });
        } catch (_) { /* fall back below */ }
        if (dish && dish.stock_type === "daily") {
            await DailyDishAvailability.updateOne(
                { dish_id: dish._id, chief_id: order.chef_id ? new mongoose.Types.ObjectId(order.chef_id) : dish.Owner_id, date },
                { $inc: { pieces_sold: qty } },
                { upsert: false }
            ).catch(() => {});
            continue;
        }
        // Regular inventory (or untyped) item → decrement Dish stock_quantity.
        const id = (dish && dish._id) || item.dish_id;
        try {
            const res = await db.collection("dishes").updateOne(
                { _id: id },
                [
                    {
                        $set: {
                            stock_quantity: { $max: [0, { $subtract: [{ $ifNull: ["$stock_quantity", 0] }, qty] }] },
                            available: {
                                $cond: [
                                    { $gt: [{ $subtract: [{ $ifNull: ["$stock_quantity", 0] }, qty] }, 0] },
                                    { $ifNull: ["$available", true] },
                                    false
                                ]
                            },
                    },
                    },
                ]
            );
            if (res.modifiedCount || res.matchedCount) {
                try {
                    const after = await db.collection("dishes").findOne({ _id: id }, { projection: { stock_quantity: 1, available: 1 } });
                    if (after && after.stock_quantity <= 0) outOfStock.push(item.dish_id);
                } catch (_) {}
            }
        } catch (_) {}
    }
    order.stock_deducted = true;
    await order.save().catch(() => {});
    return { status: "success", outOfStock };
}

// ── Atomic per-driver active-delivery counter ─────────────────────────
// Guards the "max 3 simultaneous active deliveries" rule against concurrent
// accepts. Uses a single counter document per driver, updated atomically with a
// `$lt: 3` filter (protected by a unique index + MongoDB's per-document write
// lock), so two racing accepts can never both pass the cap. The counter is
// released (decremented) when a delivery completes.

const ACTIVE_ORDERS_COLLECTION = "driver_active_orders";
const ACTIVE_ORDERS_LIMIT = 3;

async function ensureActiveOrdersIndex() {
    try {
        const db = mongoose.connection.db;
        await db.collection(ACTIVE_ORDERS_COLLECTION).createIndex(
            { driver_id: 1 },
            { unique: true }
        );
    } catch (_) {}
}

// Atomically acquire one delivery slot for a driver. Returns true on success,
// false if the driver is already at the active-delivery limit.
async function acquireDriverDeliverySlot(driverId) {
    if (!driverId) return false;
    const db = mongoose.connection.db;
    const coll = db.collection(ACTIVE_ORDERS_COLLECTION);
    await ensureActiveOrdersIndex();
    // Make sure a counter row exists for the driver (idempotent, safe under
    // the unique index).
    await coll.updateOne(
        { driver_id: driverId },
        { $setOnInsert: { active: 0 } },
        { upsert: true }
    ).catch(() => {});
    // Atomically take a slot: only matches while active < limit. The
    // per-document write lock ensures concurrent calls see the latest count.
    const inc = async () =>
        await coll.findOneAndUpdate(
            { driver_id: driverId, active: { $lt: ACTIVE_ORDERS_LIMIT } },
            { $inc: { active: 1 } },
            { returnDocument: "after" }
        );
    let res = await inc();
    // Driver >=7 returns the matched doc directly; older drivers wrap it in
    // { value }. Either way the doc has an _id on success and is null on no-match.
    if (res && (res._id || res.value)) return true;
    // The counter shows the driver is at the limit. Reconcile against the real
    // set of active orders and retry once — this self-heals slots that leaked
    // if an assigned order was later cancelled or unassigned.
    try {
        const realActive = await OrderSchema.countDocuments({
            driver_id: String(driverId),
            order_status: { $nin: ["completed", "cancelled", "delivered", ""] },
        });
        if (realActive < ACTIVE_ORDERS_LIMIT) {
            await coll.updateOne(
                { driver_id: driverId },
                { $set: { active: realActive } }
            );
            res = await inc();
            if (res && (res._id || res.value)) return true;
        }
    } catch (_) {}
    return false;
}

// Atomically release one delivery slot after the driver completes a delivery.
async function releaseDriverDeliverySlot(driverId) {
    if (!driverId) return;
    const db = mongoose.connection.db;
    await db.collection(ACTIVE_ORDERS_COLLECTION).updateOne(
        { driver_id: driverId },
        [
            {
                $set: {
                    active: {
                        $max: [{ $subtract: [{ $ifNull: ["$active", 0] }, 1] }, 0],
                    },
                },
            },
        ]
    ).catch(() => {});
}

// Apply per-item (dish) ratings from a completed order to each dish's running
// average. Uses a count so the average converges correctly.
async function applyItemRatings(itemRatings) {
    if (!Array.isArray(itemRatings) || itemRatings.length === 0) return;
    const db = mongoose.connection.db;
    for (const ir of itemRatings) {
        const dId = ir.dish_id;
        const r = Number(ir.rating);
        if (!dId || !Number.isFinite(r) || r < 1 || r > 5) continue;
        try {
            await db.collection("dishes").updateOne(
                { _id: dId },
                [
                    {
                        $set: {
                            rating: {
                                $divide: [
                                    {
                                        $add: [
                                            { $multiply: [{ $ifNull: ["$rating", 0] }, { $ifNull: ["$rating_count", 0] }] },
                                            r,
                                        ],
                                    },
                                    { $add: [{ $ifNull: ["$rating_count", 0] }, 1] },
                                ],
                            },
                            rating_count: { $add: [{ $ifNull: ["$rating_count", 0] }, 1] },
                        },
                    },
                ]
            );
        } catch (_) {}
    }
}

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
      // A customer can't place an order with a shop that is currently closed.
      await assertShopOpen(data.chef_id);

      // Reject if an ordered item is unavailable or its stock is exhausted.
      // Also backfill each item's display name/price from the dish catalog so a
      // malformed/older client payload can't fail the whole order's validation
      // (e.g. `items.0.name: path "name" is required` when name is empty/missing).
      if (!Array.isArray(data.items)) {
        data.items = [];
      }
      if (data.items.length && mongoose.connection.db) {
        const db = mongoose.connection.db;
        for (const item of data.items) {
          const dishId = item.dish_id;
          if (!dishId) continue;
          let dish = null;
          try {
            dish = await db.collection("dishes").findOne({ _id: mongoose.Types.ObjectId.isValid(dishId) ? new mongoose.Types.ObjectId(dishId) : dishId }, { projection: { available: 1, stock_quantity: 1, stock_type: 1, name: 1, english_name: 1, price: 1 } });
          } catch (_) {}
          if (dish && dish.available === false) {
            throw new Error("One of the items you selected is sold out");
          }
          if (dish) {
            const dishName = dish.english_name || dish.name;
            if (!String(item.name ?? "").trim() && dishName) {
              item.name = dishName;
            }
            if (item.price === undefined || item.price === null || Number.isNaN(Number(item.price))) {
              const p = Number(dish.price);
              item.price = Number.isFinite(p) ? p : 0;
            }
          }
        }
      }
      // Last-resort defaults so the required name/price/qty never fail validation.
      data.items = data.items.map((item) => {
        const qty = Number(item.qty);
        const price = Number(item.price);
        return {
          ...item,
          name: String(item.name ?? "").trim() || "Item",
          price: Number.isFinite(price) ? price : 0,
          qty: Number.isFinite(qty) && qty >= 1 ? qty : 1,
        };
      });

      const order = await OrderSchema.create(data);
      // Seed the order's chat so the customer and shop are participants from the
      // start — needed for each side's in-app chat popup poller to work.
      const participants = [];
      if (data.customer_id) {
        participants.push({ id: data.customer_id, role: "customer", name: data.customer_name || "" });
      }
      if (data.chef_id) {
        participants.push({ id: data.chef_id, role: "chef", name: data.chef_name || "" });
      }
      await upsertChatParticipants(String(order._id), participants);
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to create order");
    }
  }

  async getOrdersByChef(chefId) {
    try {
      await this.cancelExpiredOrders();
      const orders = await OrderSchema.find({ chef_id: chefId }).sort({ createdAt: -1 });
      const enriched = await Promise.all(orders.map((o) => enrichOrderForClient(o)));
      return { status: "success", orders: enriched };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch chef orders");
    }
  }

  async getOrdersByCustomer(customerId) {
    try {
      await this.cancelExpiredOrders();
      const orders = await OrderSchema.find({ customer_id: customerId }).sort({ createdAt: -1 });
      const enriched = await Promise.all(orders.map((o) => enrichOrderForClient(o)));
      return { status: "success", orders: enriched };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch customer orders");
    }
  }

  async getOrderById(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      const enriched = await enrichOrderForClient(order);
      return { status: "success", order: enriched };
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

  /// Shop-owner verification of a CUSTOMER's payment receipt. Only the shop
  /// that owns the order (chef_id) may approve/reject it. The customer's app
  /// leaves the transfer pending until the shop confirms it here.
  async shopVerifyPayment(orderId, chefId, status) {
    try {
      if (!chefId) throw new Error("Missing shop id");
      if (!["approved", "rejected"].includes(status)) {
        throw new Error("Status must be 'approved' or 'rejected'");
      }
      const order = await OrderSchema.findOne({ _id: orderId, chef_id: chefId });
      if (!order) throw new Error("Order not found for this shop");
      if (status === "approved") {
        // Closed shops can't confirm (and thereby accept) new orders.
        await assertShopOpen(chefId);
      }
      const update = { transaction_status: status };
      const wasAccepted = order.order_status === "accepted";
      let toAccepted = false;
      if (status === "rejected") {
        update.order_status = "cancelled";
      } else {
        update.order_status = order.order_status && order.order_status !== "pending"
          ? order.order_status
          : "accepted";
        toAccepted = !wasAccepted && update.order_status === "accepted";
      }
      const updated = await OrderSchema.findByIdAndUpdate(orderId, update, { new: true });
      // If the shop rejected (cancelled) an order a driver had been assigned to,
      // free that driver's active-delivery slot so it isn't leaked.
      if (status === "rejected" && order.driver_id) {
        await releaseDriverDeliverySlot(order.driver_id);
      }
      // Deduct stock once the order is confirmed/accepted.
      if (toAccepted) {
        try { await deductOrderStock(updated); } catch (_) {}
      }
      return { status: "success", order: updated };
    } catch (error) {
      throw new Error(error.message || "Failed to verify payment");
    }
  }

  async acceptOrder(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.order_status === "accepted") {
        return { status: "success", order };
      }
      await assertShopOpen(order.chef_id);
      const updated = await OrderSchema.findByIdAndUpdate(
        orderId,
        { order_status: "accepted" },
        { new: true }
      );
      if (!updated) throw new Error("Order not found");
      try { await deductOrderStock(updated); } catch (_) {}
      return { status: "success", order: updated };
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

  // Shop owner declines an order: they must upload a receipt proving they sent
  // the money back to the customer. The order is NOT cancelled yet — it enters a
  // "refund pending" state that stays visible to the customer (and is hidden from
  // the driver pool) until the customer confirms they received the refund.
  async declineOrderWithRefund(orderId, chefId, { refundReceipt, refundAmount, refundNote }) {
    try {
      if (!chefId) throw new Error("Missing shop id");
      const order = await OrderSchema.findOne({ _id: orderId, chef_id: chefId });
      if (!order) throw new Error("Order not found for this shop");
      if (!refundReceipt || !refundReceipt.toString().trim()) {
        throw new Error("A refund receipt is required before declining");
      }
      const amount = Number(refundAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("A refund amount is required");
      }
      const update = {
        refund_status: "shop_initiated",
        refund_receipt: refundReceipt,
        refund_amount: amount,
        ...(refundNote ? { refund_note: refundNote } : {}),
      };
      const updated = await OrderSchema.findByIdAndUpdate(orderId, update, { new: true });
      return { status: "success", order: updated };
    } catch (error) {
      throw new Error(error.message || "Failed to decline order with refund");
    }
  }

  // Customer confirms they received the refund sent back by the shop. Only the
  // customer who owns the order may confirm, and only once the shop has initiated
  // the refund. On confirmation the order is marked cancelled and refunded.
  async confirmCustomerRefund(orderId, customerId) {
    try {
      if (!customerId) throw new Error("Missing customer id");
      const order = await OrderSchema.findOne({ _id: orderId, customer_id: customerId });
      if (!order) throw new Error("Order not found for this customer");
      if (order.refund_status !== "shop_initiated") {
        throw new Error("No pending refund to confirm");
      }
      const updated = await OrderSchema.findByIdAndUpdate(
        orderId,
        {
          refund_status: "customer_confirmed",
          refunded_at: new Date(),
          order_status: "cancelled",
        },
        { new: true }
      );
      // If a driver had been assigned to this (now cancelled) order, free their
      // active-delivery slot so it isn't leaked.
      if (order.driver_id) await releaseDriverDeliverySlot(order.driver_id);
      return { status: "success", order: updated };
    } catch (error) {
      throw new Error(error.message || "Failed to confirm refund");
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

  // ────────────────────────────────────────────────────────────────── Admin Orders ───────────────────────────────────────────────────────────

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
  
  // Auto-cancel delivery-request orders the customer created but abandoned:
  // still "pending", no driver ever assigned, and older than the TTL. Running
  // this before every order-list query keeps abandoned orders from lingering
  // in the driver pool or on the shop/customer order lists.
  async cancelExpiredOrders() {
    try {
      const expiredBefore = new Date(Date.now() - PENDING_DELIVERY_TTL_MS);
      await OrderSchema.updateMany(
        {
          order_status: "pending",
          delivery_step: "none",
          refund_status: { $ne: "shop_initiated" },
          createdAt: { $lte: expiredBefore },
          $or: [
            { driver_id: { $exists: false } },
            { driver_id: null },
            { driver_id: "" },
          ],
        },
        {
          $set: {
            order_status: "cancelled",
            rejection_reason: "Delivery request expired",
          },
        }
      );
    } catch (error) {
      throw new Error(error.message || "Failed to expire abandoned orders");
    }
  }

  async getAvailableOrdersForDriver(driverId) {
    try {
      await this.cancelExpiredOrders();
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
            if (!driver.online_status || !(driver.Is_Verified || driver.Verification_Status === "approved")) eligible = false;
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

      // The pool shows EVERY open order that still needs a driver: all
      // non-terminal orders (pending / accepted / preparing / ready) with no
      // driver assigned yet. Orders already assigned to a driver, or already in
      // delivery / completed / cancelled, are excluded.
      const baseQuery = {
        order_status: { $nin: ["cancelled", "completed", "out_for_delivery", "delivered"] },
        // Hide orders the shop declined and is refunding (awaiting customer confirmation).
        refund_status: { $ne: "shop_initiated" },
        delivery_offers: { $not: { $elemMatch: { driver_id: driverId, status: "rejected" } } },
        $or: [
          { driver_id: { $exists: false } },
          { driver_id: null },
          { driver_id: "" },
        ],
      };

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
              o.customer_profile_address = cust.address || "";
            }
          } catch (_) {}
        }
        // Attach shop + customer coordinates & full text addresses for the map.
        // The customer's drop-off text must come from THIS order's
        // delivery_address (what they typed); the saved AddressService profile
        // is only a map-coordinates fallback.
        const da = o.delivery_address && typeof o.delivery_address === "object" ? o.delivery_address : null;
        const orderDeliveryParts = da
            ? [da.label, da.street, da.city, da.country].filter((p) => p && String(p).trim() !== "")
            : [];
        let customerFull = orderDeliveryParts.length ? orderDeliveryParts.join(", ") : "";
        const [shopLoc, custLoc] = await Promise.all([
          o.chef_id ? fetchAddressLocation(o.chef_id) : Promise.resolve(null),
          o.customer_id ? fetchAddressLocation(o.customer_id) : Promise.resolve(null),
        ]);
        if (shopLoc) {
        o.shop_latitude = shopLoc.latitude;
        o.shop_longitude = shopLoc.longitude;
        o.shop_full_address = shopLoc.full_text || o.chef_address || "";
      } else {
        o.shop_full_address = o.chef_address || "";
      }
        if (custLoc) {
          o.customer_latitude = custLoc.latitude;
          o.customer_longitude = custLoc.longitude;
          if (!customerFull) customerFull = custLoc.full_text || o.customer_profile_address || o.delivery_address?.street || "";
      } else if (!customerFull) {
        customerFull = o.customer_profile_address || o.delivery_address?.street || "";
      }
        o.customer_full_address = customerFull;
        return o;
      }));

      // NOTE: no city-based filtering is applied — every open unassigned order
      // is shown so the driver sees all the orders that were made.

      return { status: "success", orders: enriched };
    } catch (error) {
      throw new Error(error.message || "Failed to fetch available orders for driver");
    }
  }

  async acceptOrderDriver(orderId, driverId) {
    try {
      let driverName = "";
      // Reject offline / unverified drivers.
      if (driverId) {
        try {
          const dRes = await fetch(`${DRIVER_SERVICE_URL}/${driverId}`, { headers: { "Content-Type": "application/json" } });
          if (dRes.ok) {
            const dData = await dRes.json();
            const driver = dData.profile || dData.driver || dData;
            driverName = driver.name || driver.full_name || "";
            if (!driver.online_status || !(driver.Is_Verified || driver.Verification_Status === "approved")) {
              throw new Error("Go online and complete account activation to accept orders");
            }
          }
        } catch (e) {
          if (e && e.message && e.message.includes("activation")) throw e;
        }
      }
      // Atomically reserve a delivery slot (max 3 active per driver). This is
      // race-safe: concurrent accepts by the same driver can never both pass.
      if (!(await acquireDriverDeliverySlot(driverId))) {
        throw new Error("You already have 3 active deliveries. Complete one before accepting more.");
      }
      try {
        const order = await OrderSchema.findOneAndUpdate(
          {
            _id: orderId,
            order_status: { $nin: ["cancelled", "completed", "out_for_delivery", "delivered"] },
            refund_status: { $ne: "shop_initiated" },
            $or: [{ driver_id: { $exists: false } }, { driver_id: null }, { driver_id: "" }],
          },
          [
            {
              $set: {
                driver_id: driverId,
                delivery_step: "accepted",
                // A shop order that's already being prepared / ready for pickup
                // must NOT be stepped backwards to "accepted" — the driver
                // simply comes to the shop to collect it.
                order_status: {
                  $cond: {
                    if: { $in: ["$order_status", ["preparing", "ready"]] },
                    then: "$order_status",
                    else: "accepted",
                  },
                },
              },
            },
          ],
          { new: true, updatePipeline: true }
        );
        if (!order) {
          // Claim failed — free the reserved slot so it isn't leaked.
          await releaseDriverDeliverySlot(driverId);
          throw new Error("Order not available or already accepted by another driver");
        }
        // Add the driver to the order's chat so the customer and driver can
        // message each other and both get in-app chat popups.
        await upsertChatParticipants(String(order._id), [{ id: driverId, role: "driver", name: driverName }]);
        return { status: "success", order };
      } catch (err) {
        // Release the slot if the assignment itself failed for any reason.
        await releaseDriverDeliverySlot(driverId).catch(() => {});
        throw err;
      }
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
          if (!driver.online_status || !(driver.Is_Verified || driver.Verification_Status === "approved")) {
            throw new Error("Go online and complete account activation to send offers");
          }
        }
      } catch (e) {
        if (e && e.message && e.message.includes("activation")) throw e;
      }

      // Atomically add (or refresh) the driver's proposed offer on the order.
      // One single-document update, so concurrent drivers proposing at the same
      // time can't overwrite each other's offers (a read-modify-write + save()
      // would lose updates). Dedupes the bidding driver's own prior proposal.
      //
      // IMPORTANT: this uses a raw aggregation pipeline (updatePipeline: true),
      // so Mongoose does NOT auto-generate subdocument _ids. We must create the
      // offer's _id ourselves, otherwise order.delivery_offers.find(offerId) /
      // .id(offerId) can never locate the offer → "Offer not found" when the
      // customer or shop tries to respond to it.
      const newOfferId = new mongoose.Types.ObjectId();
      const closed = ["out_for_delivery", "delivered", "completed", "cancelled"];
      const res = await OrderSchema.updateOne(
        {
          _id: orderId,
          $or: [{ driver_id: { $exists: false } }, { driver_id: null }, { driver_id: "" }],
          order_status: { $nin: closed },
        },
        [
          {
            $set: {
              delivery_offers: {
                $concatArrays: [
                  {
                    $filter: {
                      input: { $ifNull: ["$delivery_offers", []] },
                      as: "o",
                      cond: {
                        $or: [
                          { $ne: ["$$o.status", "proposed"] },
                          { $ne: [{ $toString: { $ifNull: ["$$o.driver_id", ""] } }, String(driverId)] },
                        ],
                      },
                    },
                  },
                  [
                    {
                      _id: newOfferId,
                      driver_id: String(driverId),
                      driver_name: driverName || "Driver",
                      amount: price,
                      status: "proposed",
                      created_at: new Date(),
                    },
                  ],
                ],
              },
            },
          },
        ],
        { updatePipeline: true }
      );

      if (!res.matchedCount) {
        const order = await OrderSchema.findById(orderId);
        if (!order) throw new Error("Order not found");
        if (order.driver_id) throw new Error("Order already has a driver");
        throw new Error("Order is not open for offers");
      }

      const updated = await OrderSchema.findById(orderId);
      return { status: "success", order: updated };
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
        // The accepting driver also consumes one of their active-delivery slots.
        if (!(await acquireDriverDeliverySlot(offer.driver_id))) {
          throw new Error("Driver already has 3 active deliveries — this offer can't be accepted");
        }
        try {
          for (const o of order.delivery_offers) {
            o.status = o._id.toString() === offerId ? "accepted" : "rejected";
          }
          order.driver_id = offer.driver_id;
          order.agreed_delivery_fee = offer.amount;
          order.order_status = "accepted";
          order.delivery_step = "accepted";
          await upsertChatParticipants(String(order._id), [{ id: offer.driver_id, role: "driver", name: offer.driver_name || "" }]);
          await order.save();
        } catch (err) {
          // Roll back the reserved slot if the assignment failed.
          await releaseDriverDeliverySlot(offer.driver_id).catch(() => {});
          throw err;
        }
      } else {
        offer.status = "rejected";
        await order.save();
      }
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to respond to offer");
    }
  }

  // Shop owner accepts a driver's delivery offer for a shop order. Unlike the
  // customer-facing respondDeliveryOffer (which resets an order to "accepted"),
  // this keeps the shop order's current status (e.g. "ready") so the driver
  // simply comes to the shop to pick up. Assigns the driver and locks in the
  // agreed delivery fee from the winning offer.
  async acceptDriverOfferForShop(orderId, offerId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      const offer = (order.delivery_offers || []).id(offerId);
      if (!offer) throw new Error("Offer not found");
      if (offer.status !== "proposed") throw new Error("Offer already answered");
      if (order.driver_id) throw new Error("Order already has a driver");
      if (["out_for_delivery", "completed", "cancelled", "delivered"].includes(order.order_status)) {
        throw new Error("Order is no longer open for a driver");
      }

      // The accepting driver also consumes one of their active-delivery slots.
      if (!(await acquireDriverDeliverySlot(offer.driver_id))) {
        throw new Error("Driver already has 3 active deliveries — this offer can't be accepted");
      }
      try {
        for (const o of order.delivery_offers) {
          o.status = o._id.toString() === offerId ? "accepted" : "rejected";
        }
        order.driver_id = offer.driver_id;
        order.agreed_delivery_fee = offer.amount;
        if (!["ready", "preparing", "accepted"].includes(order.order_status)) {
          order.order_status = "accepted";
        }
        order.delivery_step = "accepted";
        await upsertChatParticipants(String(order._id), [{ id: offer.driver_id, role: "driver", name: offer.driver_name || "" }]);
        await order.save();
      } catch (err) {
        // Roll back the reserved slot if the assignment failed.
        await releaseDriverDeliverySlot(offer.driver_id).catch(() => {});
        throw err;
      }
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to accept driver offer");
    }
  }

  // Shop owner rejects a driver's offer (frees the order for another bid).
  async rejectDriverOfferForShop(orderId, offerId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      const offer = (order.delivery_offers || []).id(offerId);
      if (!offer) throw new Error("Offer not found");
      if (offer.status !== "proposed") throw new Error("Offer already answered");
      offer.status = "rejected";
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to reject driver offer");
    }
  }

  // Shop owner explicitly requests a driver for an order. Flags it as seeking
  // a driver so it's clearly surfaced in the driver pool / driver app, and it
  // becomes visible to drivers as soon as the order is open and unassigned.
  async requestDriverForShop(orderId) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.driver_id) throw new Error("Order already has a driver assigned");
      if (["out_for_delivery", "completed", "cancelled", "delivered"].includes(order.order_status)) {
        throw new Error("Order is no longer open for a driver");
      }
      order.driver_requested = true;
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to request a driver");
    }
  }

  async getDriverOrders(driverId) {
    try {
      await this.cancelExpiredOrders();
      const orders = await OrderSchema.find({ driver_id: driverId }).sort({ createdAt: -1 });
      const enriched = await Promise.all(orders.map(async (order) => {
        const o = order.toObject();
        if (o.chef_id) {
          try {
            const chef = await ShopOwnerProfileSchema.findById(o.chef_id).select("name phone shop_address profile_image shop_cover Payment_Method");
            if (chef) {
              o.chef_name = chef.name;
              o.chef_phone = chef.phone;
              o.chef_address = chef.shop_address || "";
              o.chef_image = chef.shop_cover || chef.profile_image || "";
              if (chef.Payment_Method) {
                o.chef_payment_method = {
                  provider: chef.Payment_Method.provider || "",
                  details: chef.Payment_Method.details || "",
                };
              }
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
              o.customer_profile_address = cust.address || "";
            }
          } catch (_) {}
        }
        // Attach shop + customer coordinates & full text addresses for the map.
        // The customer's drop-off text must come from THIS order's
        // delivery_address (what they typed); the saved AddressService profile
        // is only a map-coordinates fallback.
        const da = o.delivery_address && typeof o.delivery_address === "object" ? o.delivery_address : null;
        const orderDeliveryParts = da
            ? [da.label, da.street, da.city, da.country].filter((p) => p && String(p).trim() !== "")
            : [];
        let customerFull = orderDeliveryParts.length ? orderDeliveryParts.join(", ") : "";
        const [shopLoc, custLoc] = await Promise.all([
          o.chef_id ? fetchAddressLocation(o.chef_id) : Promise.resolve(null),
          o.customer_id ? fetchAddressLocation(o.customer_id) : Promise.resolve(null),
        ]);
        if (shopLoc) {
        o.shop_latitude = shopLoc.latitude;
        o.shop_longitude = shopLoc.longitude;
        o.shop_full_address = shopLoc.full_text || o.chef_address || "";
      } else {
        o.shop_full_address = o.chef_address || "";
      }
        if (custLoc) {
          o.customer_latitude = custLoc.latitude;
          o.customer_longitude = custLoc.longitude;
          if (!customerFull) customerFull = custLoc.full_text || o.customer_profile_address || o.delivery_address?.street || "";
      } else if (!customerFull) {
        customerFull = o.customer_profile_address || o.delivery_address?.street || "";
      }
        o.customer_full_address = customerFull;
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
      const balanceThreshold = config.balance_threshold ?? 0;
      const shopFeePercent = config.shop_fee_percent ?? config.app_fee_percent ?? 10;
      const driverFeePercent = config.driver_fee_percent ?? 0;
      const defaultDeliveryFee = config.default_delivery_fee ?? 15;

      // Use the negotiated delivery fee if available, otherwise the default.
      const driverFee = order.agreed_delivery_fee ?? order.delivery_fee ?? defaultDeliveryFee;

      // Apply the shop app fee percentage on the food total.
      const shopAppFee = order.total * (shopFeePercent / 100);
      const chefEarnings = order.total - shopAppFee;

      // Apply the driver app fee percentage on the delivery fee (driver collects it).
      const driverAppFee = driverFee * (driverFeePercent / 100);
      const driverNet = driverFee - driverAppFee;

      order.order_status = "completed";
      order.delivery_fee = driverFee;
      await order.save();
      // Free this driver's active-delivery slot for the completed order.
      await releaseDriverDeliverySlot(order.driver_id);

      // Update chef earnings + track platform balance, apply auto-suspend.
      if (order.chef_id) {
         const chef = await ShopOwnerProfileSchema.findById(order.chef_id);
         if (chef) {
             if(!chef.earnings) chef.earnings = { total: 0, this_week: 0, pending: 0 };
             chef.earnings.pending += Math.max(0, chefEarnings);
             chef.platform_balance = (chef.platform_balance || 0) + shopAppFee;
             if (chef.platform_balance < balanceThreshold) {
                 chef.Is_Active = false;
             }
             await chef.save();
         }
      }

      // Update driver earnings via API call (net after app fee) + track the
      // driver's platform fee so the driver-service can apply its own threshold.
      if (order.driver_id) {
         try {
            await fetch(`${DRIVER_SERVICE_URL}/${order.driver_id}/earnings`, {
               method: "PATCH",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ amount: driverNet, platformFee: driverAppFee, balanceThreshold })
            });
         } catch (_) {}
      }

      return { status: "success", order, breakdown: { foodTotal: order.total, shopAppFee, driverAppFee, driverNet, driverFee, chefEarnings } };
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
        // Free this driver's active-delivery slot now that the delivery is done.
        await releaseDriverDeliverySlot(order.driver_id);
      } else if (step === "picked_up" || step === "in_transit") {
        // The driver left the shop with the order; the shop's prep phase is
        // over and the delivery is now in progress.
        order.order_status = "out_for_delivery";
      }
      await order.save();

      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to update delivery step");
    }
  }

  // Driver hands the collected cash delivery fee to the shop in person.
  // The shop must confirm receipt before the driver is cleared.
  async driverCashHandoff(orderId, driverId) {
    try {
      const order = await OrderSchema.findOne({ _id: orderId, driver_id: driverId });
      if (!order) throw new Error("Order not found or not assigned to this driver");

      const amount = order.agreed_delivery_fee ?? order.delivery_fee ?? 0;
      order.driver_delivery_payment = {
        method: "cash",
        status: "cash_handed",
        amount,
        image: order.driver_delivery_payment?.image || "",
        confirmed_at: null,
      };
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to record cash handoff");
    }
  }

  // Driver transfers the delivery fee online to the shop's payment method and
  // uploads a receipt image. The shop must confirm the receipt.
  async driverOnlineTransfer(orderId, driverId, image) {
    try {
      const order = await OrderSchema.findOne({ _id: orderId, driver_id: driverId });
      if (!order) throw new Error("Order not found or not assigned to this driver");
      if (!image) throw new Error("Receipt image is required");

      const amount = order.agreed_delivery_fee ?? order.delivery_fee ?? 0;
      order.driver_delivery_payment = {
        method: "online",
        status: "transfer_pending",
        amount,
        image,
        confirmed_at: null,
      };
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to record online transfer");
    }
  }

  // Shop confirms receipt of the driver's cash handoff or online transfer.
  async shopConfirmDriverPayment(orderId, chefId) {
    try {
      const order = await OrderSchema.findOne({ _id: orderId, chef_id: chefId });
      if (!order) throw new Error("Order not found or not assigned to this shop");

      if (!order.driver_delivery_payment ||
          order.driver_delivery_payment.status === "none") {
        throw new Error("Driver has not reported any settlement yet");
      }
      if (order.driver_delivery_payment.status === "confirmed") {
        throw new Error("Driver payment already confirmed");
      }

      order.driver_delivery_payment.status = "confirmed";
      order.driver_delivery_payment.confirmed_at = new Date();
      await order.save();
      return { status: "success", order };
    } catch (error) {
      throw new Error(error.message || "Failed to confirm driver payment");
    }
  }

  async rateOrder(orderId, rating, driverRating, comment, itemRatings) {
    try {
      const order = await OrderSchema.findById(orderId);
      if (!order) throw new Error("Order not found");
      if (order.order_status !== "completed") throw new Error("Order must be completed before rating");

      order.rating = rating;
      if (driverRating) order.driver_rating = driverRating;
      if (comment) order.review_comment = comment;
      if (Array.isArray(itemRatings) && itemRatings.length) {
        order.item_ratings = itemRatings
          .filter((ir) => ir && ir.dish_id && Number.isFinite(Number(ir.rating)))
          .map((ir) => ({ dish_id: String(ir.dish_id), rating: Number(ir.rating) }));
      }
      await order.save();

      // Persist per-item (dish) ratings to each dish's running average.
      if (Array.isArray(itemRatings) && itemRatings.length) {
        try { await applyItemRatings(order.item_ratings); } catch (_) {}
      }

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

