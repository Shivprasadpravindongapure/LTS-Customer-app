import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../utils/upload";
import {
  createBusinessSchema,
  updateBusinessSchema,
  listBusinessQuerySchema,
} from "../utils/validation/businessSchemas";
import {
  createBusiness,
  getMyBusiness,
  updateMyBusiness,
  uploadPhotos,
  reorderPhotos,
  deletePhoto,
  previewBusiness,
  listBusinesses,
} from "../controllers/businessController";
import { getAnalytics } from "../controllers/analyticsController";

const router = Router();

// Public
router.get("/", validate(listBusinessQuerySchema), listBusinesses);
router.get("/:id/preview", previewBusiness);

// Owner-only
router.post("/", requireAuth, validate(createBusinessSchema), createBusiness);
router.get("/me/mine", requireAuth, getMyBusiness);
router.patch("/me/mine", requireAuth, validate(updateBusinessSchema), updateMyBusiness);
router.post("/me/photos", requireAuth, upload.array("photos", 20), uploadPhotos);
router.patch("/me/photos/reorder", requireAuth, reorderPhotos);
router.delete("/me/photos/:url", requireAuth, deletePhoto);
router.get("/me/analytics", requireAuth, getAnalytics);

export default router;
