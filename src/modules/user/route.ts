import { Router } from "express";
import UserController from "./controller";

const router = Router();
const userConteroller = new UserController();

router.post("/users", userConteroller.create);
router.post("/users/bulk", userConteroller.bulkCreate);

export default router;
