import { Router } from "express";
import { bulkCreateUsers, createUser } from "./user.controller";

const router = Router();

router.post("/users", createUser);
router.post("/users/bulk", bulkCreateUsers);

export default router;
