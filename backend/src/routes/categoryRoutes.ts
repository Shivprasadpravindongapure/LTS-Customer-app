import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { listCategories, createCategory, deleteCategory } from "../controllers/categoryController";

const router = Router();

router.get("/", listCategories); // public — needed for onboarding category picker
router.post("/", requireAuth, requireRole("admin"), createCategory);
router.delete("/:id", requireAuth, requireRole("admin"), deleteCategory);

export default router;
