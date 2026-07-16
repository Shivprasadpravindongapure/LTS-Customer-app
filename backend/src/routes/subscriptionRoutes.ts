import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getPlanCatalog, checkoutPlan, getMySubscription } from "../controllers/subscriptionController";

const router = Router();

router.get("/plans", getPlanCatalog); // public — plan comparison screen
router.get("/mine", requireAuth, getMySubscription);
router.post("/checkout", requireAuth, checkoutPlan);

export default router;
