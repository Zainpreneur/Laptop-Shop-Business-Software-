import { Router } from "express";
import { listSales, getSale, createSale, cancelSale } from "../controllers/sales.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listSales));
router.get("/:id", asyncHandler(getSale));
router.post("/", asyncHandler(createSale));
router.post("/:id/cancel", requireRole("ADMIN"), asyncHandler(cancelSale));

export default router;
