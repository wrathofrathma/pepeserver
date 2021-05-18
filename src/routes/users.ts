import {Router} from "express";
import AuthMiddleware from "../middleware/auth";
import UserController from "../controllers/http/UserController";

const router = Router();

router.get("/avatar/index", UserController.avatarIndex);
router.use(AuthMiddleware);
router.post("/username/reroll", UserController.rerollUsername);
router.patch("/avatar", UserController.updateAvatar);


export default router;