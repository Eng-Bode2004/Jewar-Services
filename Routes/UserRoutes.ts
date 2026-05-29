import UserControllers from "../Controllers/UserControllers.js";

// import Middleware
import RegisterUser from "../Middlewares/RegisterUser.js"




import express from "express";

const router = express.Router();

   ///////////////////////////////////////////Routes///////////////////////////////////
router.post("/register",RegisterUser,    UserControllers.createUser);
router.post("/generate-username", UserControllers.createRandomUsernameAI);


export default router;
