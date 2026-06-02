import RoleControllers from "../Controllers/RoleControllers.ts";
import validateRole from "../Middlewares/ValidateRole.ts";
import express from "express";

const router = express.Router();

router.post("/", validateRole, RoleControllers.createRole);
router.get("/", RoleControllers.getAllRoles);
router.get("/language/:lang", RoleControllers.getRolesByLanguage);
router.get("/:id", RoleControllers.getRoleById);
router.put("/:id", RoleControllers.updateRole);
router.delete("/:id", RoleControllers.deleteRole);



export default router;
