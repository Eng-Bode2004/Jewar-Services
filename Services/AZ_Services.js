import AZ_Schema from "../Models/AZ_Schema.js";
import inside from "point-in-polygon";
import { getDistance } from "geolib";
import "dotenv/config";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ;
const GEMINI_API_URL = process.env.GEMINI_API_URL;

class AZ_Services {

    // =========================================================
    // CREATE NEW AVAILABILITY ZONE
    // =========================================================
    async createZone(zoneData) {
        try {
            const { name, governorate, city, polygon, delivery_fee_base, delivery_fee_per_km } = zoneData;

            const existZone = await AZ_Schema.findOne({ name });
            if (existZone) {
                throw new Error("Zone already exists");
            }

            if (!Array.isArray(polygon) || polygon.length < 3) {
                throw new Error("Polygon must contain at least 3 points");
            }

            polygon.forEach(p => {
                if (!p.lat || !p.lng) {
                    throw new Error("Polygon points must include lat and lng");
                }
            });

            const zone = await AZ_Schema.create({
                name,
                governorate,
                city,
                polygon,
                delivery_fee_base,
                delivery_fee_per_km,
            });

            return zone;

        } catch (error) {
            throw error;
        }
    }


    // =========================================================
    // GET ALL ZONES
    // =========================================================
    async getAllZones() {
        return await AZ_Schema.find({});
    }


    // =========================================================
    // GET ZONE BY ID
    // =========================================================
    async getZoneById(id) {
        const zone = await AZ_Schema.findById(id);
        if (!zone) throw new Error("Zone not found");
        return zone;
    }


    // =========================================================
    // UPDATE ZONE
    // =========================================================
    async updateZone(id, data) {
        const zone = await AZ_Schema.findByIdAndUpdate(id, data, { new: true });

        if (!zone) throw new Error("Zone not found");
        return zone;
    }


    // =========================================================
    // DELETE ZONE
    // =========================================================
    async deleteZone(id) {
        const zone = await AZ_Schema.findByIdAndDelete(id);
        if (!zone) throw new Error("Zone not found");
        return { message: "Zone deleted successfully" };
    }


    // =========================================================
    // TOGGLE ACTIVE / INACTIVE
    // =========================================================
    async toggleZoneStatus(id) {
        const zone = await AZ_Schema.findById(id);
        if (!zone) throw new Error("Zone not found");

        zone.status = zone.status === "active" ? "inactive" : "active";
        await zone.save();

        return zone;
    }

    // =========================================================
    // GET ZONE STATISTICS
    // =========================================================
    async getZoneStats() {
        const zones = await AZ_Schema.find({});

        const totalZones = zones.length;
        const governoratesSet = new Set(zones.map(z => z.governorate).filter(Boolean));
        const citiesSet = new Set(zones.map(z => z.city).filter(Boolean));
        const governoratesCovered = governoratesSet.size;
        const citiesCovered = citiesSet.size;

        const zonesWithAvgBase = zones.filter(z => z.delivery_avg_fee_base != null);
        const zonesWithHighest = zones.filter(z => z.delivery_highest_fee_base != null);
        const zonesWithLowest = zones.filter(z => z.delivery_lowest_fee_base != null);
        const zonesWithPerKm = zones.filter(z => z.delivery_fee_per_km != null);

        const avgBaseFee = zonesWithAvgBase.length
            ? zonesWithAvgBase.reduce((sum, z) => sum + z.delivery_avg_fee_base, 0) / zonesWithAvgBase.length
            : 0;

        const highestBaseFee = zonesWithHighest.length
            ? Math.max(...zonesWithHighest.map(z => z.delivery_highest_fee_base))
            : 0;

        const lowestBaseFee = zonesWithLowest.length
            ? Math.min(...zonesWithLowest.map(z => z.delivery_lowest_fee_base))
            : 0;

        const avgPerKm = zonesWithPerKm.length
            ? zonesWithPerKm.reduce((sum, z) => sum + z.delivery_fee_per_km, 0) / zonesWithPerKm.length
            : 0;

        return {
            totalZones,
            governoratesCovered,
            citiesCovered,
            avgBaseFee: Math.round(avgBaseFee * 100) / 100,
            highestBaseFee: Math.round(highestBaseFee * 100) / 100,
            lowestBaseFee: Math.round(lowestBaseFee * 100) / 100,
            avgPerKm: Math.round(avgPerKm * 100) / 100,
        };
    }

    // =========================================================
    // CHECK IF A POINT IS INSIDE ANY ZONE
    // =========================================================

    async checkLocation(point) {
        const { lat, lng } = point;
        const zones = await AZ_Schema.find({ status: "active" });

        let matchedZone = null;
        for (const zone of zones) {
            const polygonPoints = zone.polygon.map(p => [p.lat, p.lng]);
            if (inside([lat, lng], polygonPoints)) {
                matchedZone = zone;
                break;
            }
        }

        if (matchedZone) {
            return { insideZone: true, zone: matchedZone };
        }

        // حساب أقرب منطقة
        let closestZone = null;
        let minDistance = Infinity;

        zones.forEach(zone => {
            const avgLat = zone.polygon.reduce((sum, p) => sum + p.lat, 0) / zone.polygon.length;
            const avgLng = zone.polygon.reduce((sum, p) => sum + p.lng, 0) / zone.polygon.length;

            const distance = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: avgLat, longitude: avgLng }
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestZone = zone;
            }
        });

        return {
            insideZone: false,
            suggestedZone: closestZone ? closestZone.name : null,
            distanceToSuggestedZone_m: minDistance,
        };
    }


}

export default new AZ_Services();
