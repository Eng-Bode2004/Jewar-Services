import express from "express";
import AddressController from "../Controllers/AddressControllers.ts";

const router = express.Router();

router.post("/", AddressController.create);
router.get("/", AddressController.getAll);
router.get("/:id", AddressController.getById);
router.put("/:id", AddressController.update);
router.delete("/:id", AddressController.delete);
router.patch("/set-primary", AddressController.setPrimary);

export default router;
