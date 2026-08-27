import { Router } from "express";
import {
  listRepairTickets,
  getRepairTicket,
  createRepairTicket,
  updateRepairTicket,
  deleteRepairTicket,
} from "../controllers/repairs.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(listRepairTickets));
router.get("/:id", asyncHandler(getRepairTicket));
router.post("/", asyncHandler(createRepairTicket));
router.patch("/:id", asyncHandler(updateRepairTicket));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteRepairTicket));

export default router;
