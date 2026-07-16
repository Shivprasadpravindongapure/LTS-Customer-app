import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { submitReview, listMyReviews, replyToReview, flagReview } from "../controllers/reviewController";

const router = Router();

router.post("/", submitReview); // public, from consumer app
router.get("/mine", requireAuth, listMyReviews);
router.patch("/:id/reply", requireAuth, replyToReview);
router.patch("/:id/flag", requireAuth, flagReview);

export default router;
