import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { submitEnquiry, listMyEnquiries, updateEnquiryStatus } from "../controllers/enquiryController";

const router = Router();

router.post("/", submitEnquiry); // public, from consumer app
router.get("/mine", requireAuth, listMyEnquiries);
router.patch("/:id/status", requireAuth, updateEnquiryStatus);

export default router;
