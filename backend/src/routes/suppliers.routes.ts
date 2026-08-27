import { Router } from "express";
import {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliers.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listSuppliers));
router.get("/:id", asyncHandler(getSupplier));
router.post("/", requireRole("ADMIN"), asyncHandler(createSupplier));
router.patch("/:id", requireRole("ADMIN"), asyncHandler(updateSupplier));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteSupplier));

export default router;
