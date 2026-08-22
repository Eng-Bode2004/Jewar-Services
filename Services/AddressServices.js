import AddressSchema from "../Models/Address_Schema.ts";

const AZ_CHECK_URL = process.env.AZ_CHECK_URL || "https://jewaravailabilityzone-services-production.up.railway.app/api/v1/az/check-location";

class AddressServices {

    async reverseGeocode(lat, lng) {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
        const res = await fetch(url, {
            headers: { "User-Agent": "Savora-Address-Service/1.0" },
        });
        if (!res.ok) throw new Error("Failed to reverse geocode");
        const data = await res.json();
        const addr = data.address || {};
        return {
            country: addr.country || "",
            governorate: addr.state || addr.region || addr.county || "",
            city: addr.city || addr.town || addr.village || addr.municipality || "",
            street: addr.road || addr.street || addr.path || "",
        };
    }

    async checkAvailabilityZone(lat, lng) {
        const res = await fetch(AZ_CHECK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
        });
        const data = await res.json();
        if (data.status !== "success") throw new Error(data.message || "AZ check failed");
        return data.response;
    }

    async createAddress(data) {
        const { latitude, longitude, Profile_id, building_Number, apartment, floor, address_type, label, is_primary } = data;

        const geo = await this.reverseGeocode(latitude, longitude);
        const azResult = await this.checkAvailabilityZone(latitude, longitude);

        if (!azResult.insideZone) {
            const msg = azResult.suggestedZone
                ? `Location is outside all service areas. Nearest zone: ${azResult.suggestedZone} (${Math.round(azResult.distanceToSuggestedZone_m)}m away)`
                : "Location is outside all service areas";
            throw new Error(msg);
        }

        const address = await AddressSchema.create({
            Profile_id,
            longitude,
            latitude,
            country: geo.country,
            governorate: geo.governorate,
            city: geo.city,
            street: geo.street,
            building_Number: building_Number || "",
            apartment: apartment || "",
            floor: floor || "",
            address_type: address_type || "home",
            label: label || "",
            is_primary: is_primary || false,
            zone_id: azResult.zone._id,
        });

        return { status: "success", address };
    }

    async getAllAddresses(filter = {}) {
        const addresses = await AddressSchema.find(filter).sort({ createdAt: -1 });
        return { status: "success", addresses };
    }

    async getAddressById(id) {
        const address = await AddressSchema.findById(id);
        if (!address) throw new Error("Address not found");
        return { status: "success", address };
    }

    async updateAddress(id, data) {
        const address = await AddressSchema.findByIdAndUpdate(id, data, { new: true });
        if (!address) throw new Error("Address not found");
        return { status: "success", address };
    }

    async deleteAddress(id) {
        const deleted = await AddressSchema.findByIdAndDelete(id);
        if (!deleted) throw new Error("Address not found");
        return { status: "success", message: "Address deleted" };
    }

    async setPrimary(profileId, addressId) {
        await AddressSchema.updateMany({ Profile_id: profileId }, { is_primary: false });
        const address = await AddressSchema.findByIdAndUpdate(addressId, { is_primary: true }, { new: true });
        if (!address) throw new Error("Address not found");
        return { status: "success", address };
    }

}

export default new AddressServices();
