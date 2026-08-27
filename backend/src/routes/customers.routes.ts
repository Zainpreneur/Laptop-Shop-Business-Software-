import { Router } from "express";
import {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listCustomers));
router.get("/:id", asyncHandler(getCustomer));
router.post("/", asyncHandler(createCustomer));
router.patch("/:id", asyncHandler(updateCustomer));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteCustomer));

export default router;
