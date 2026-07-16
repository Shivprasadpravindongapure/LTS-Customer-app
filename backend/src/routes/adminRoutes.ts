import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  listPendingBusinesses,
  approveBusiness,
  rejectBusiness,
  listFlaggedReviews,
  resolveFlaggedReview,
  platformStats,
} from "../controllers/adminController";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/businesses/pending", listPendingBusinesses);
router.patch("/businesses/:id/approve", approveBusiness);
router.delete("/businesses/:id/reject", rejectBusiness);
router.get("/reviews/flagged", listFlaggedReviews);
router.patch("/reviews/:id/resolve", resolveFlaggedReview);
router.get("/stats", platformStats);

export default router;
