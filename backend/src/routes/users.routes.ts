import { Router } from "express";
import { listUsers, createUser, updateUser, deleteUser } from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", asyncHandler(listUsers));
router.post("/", asyncHandler(createUser));
router.patch("/:id", asyncHandler(updateUser));
router.delete("/:id", asyncHandler(deleteUser));

export default router;
