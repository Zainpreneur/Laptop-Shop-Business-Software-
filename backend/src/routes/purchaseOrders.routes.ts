import { Router } from "express";
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from "../controllers/purchaseOrders.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(listPurchaseOrders));
router.get("/:id", asyncHandler(getPurchaseOrder));
router.post("/", asyncHandler(createPurchaseOrder));
router.post("/:id/receive", asyncHandler(receivePurchaseOrder));
router.post("/:id/cancel", asyncHandler(cancelPurchaseOrder));

export default router;
