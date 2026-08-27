import { Router } from "express";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/products.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.post("/", requireRole("ADMIN"), asyncHandler(createProduct));
router.patch("/:id", requireRole("ADMIN"), asyncHandler(updateProduct));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteProduct));

export default router;
