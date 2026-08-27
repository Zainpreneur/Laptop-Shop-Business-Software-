import { Router } from "express";
import {
  listBrands,
  createBrand,
  deleteBrand,
  listCategories,
  createCategory,
  deleteCategory,
} from "../controllers/catalog.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/brands", asyncHandler(listBrands));
router.post("/brands", requireRole("ADMIN"), asyncHandler(createBrand));
router.delete("/brands/:id", requireRole("ADMIN"), asyncHandler(deleteBrand));

router.get("/categories", asyncHandler(listCategories));
router.post("/categories", requireRole("ADMIN"), asyncHandler(createCategory));
router.delete("/categories/:id", requireRole("ADMIN"), asyncHandler(deleteCategory));

export default router;
