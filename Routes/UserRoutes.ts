import UserControllers from "../Controllers/UserControllers.ts";
import { validateRegistration } from "../Middlewares/RegisterUser.ts";
import { authenticate } from "../Middlewares/Auth.ts";
import express from "express";

const router = express.Router();

router.post("/register/phone", validateRegistration, UserControllers.registerWithPhone);
router.post("/register/email", validateRegistration, UserControllers.registerWithEmail);
router.post("/login", UserControllers.login);
router.post("/find-or-create-by-phone", UserControllers.findOrCreateByPhone);
router.post("/phone-login", UserControllers.phoneLogin);
router.post("/forgot-password", UserControllers.forgotPassword);
router.post("/reset-password", UserControllers.resetPassword);
router.post("/social-login", UserControllers.socialLogin);
router.get("/generate-username", UserControllers.generateUsername);

router.get("/", UserControllers.getAllUsers);
router.get("/:id/language", UserControllers.getUserLanguage);
router.get("/:id", UserControllers.getUserById);
router.put("/:id/verify", UserControllers.verifyUser);
router.put("/:id/role", authenticate, UserControllers.assignRole);
router.put("/:id/profile", authenticate, UserControllers.assignProfile);
router.put("/:id/password", authenticate, UserControllers.changePassword);
router.put("/:id/language", authenticate, UserControllers.changeLanguage);
router.delete("/:id", authenticate, UserControllers.deleteUser);

export default router;
