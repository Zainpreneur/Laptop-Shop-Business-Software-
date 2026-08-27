import { Router } from "express";
import { getSummary } from "../controllers/dashboard.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/summary", asyncHandler(getSummary));

export default router;
