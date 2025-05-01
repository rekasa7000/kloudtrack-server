import { Router } from "express";
import { getDataAnalysis } from "./data-analysis.controller";

const router = Router();

router.get("", getDataAnalysis);


export default router;