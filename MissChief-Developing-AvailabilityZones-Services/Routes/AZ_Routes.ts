import express from 'express';
import AZ_Controllers from "../Controllers/AZ_Controllers";

const router = express.Router();

// =======================
// Availability Zone Routes
// =======================

// Create new zone
router.post('/', AZ_Controllers.createZone);

// Get all zones
router.get('/', AZ_Controllers.getAllZones);

// Get zone by ID
router.get('/:id', AZ_Controllers.getZoneById);

// Update zone
router.put('/:id', AZ_Controllers.updateZone);

// Delete zone
router.delete('/:id', AZ_Controllers.deleteZone);

// Toggle zone active/inactive
router.patch('/:id/toggle', AZ_Controllers.toggleZoneStatus);

router.post("/check-location", AZ_Controllers.checkLocation);


export default router;
