import {Router} from "express";
import AuthMiddleware from "../middleware/auth";
import RoomController from "../controllers/http/RoomController";

const router = Router();

router.use(AuthMiddleware);

router.post("/create", RoomController.create);
router.post("/join/:id", RoomController.join);
router.post("/leave/:id", RoomController.leave);

export default router;