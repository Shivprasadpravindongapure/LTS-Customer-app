import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  requestOtpSchema,
  verifyOtpSchema,
  createAccountSchema,
  refreshTokenSchema,
} from "../utils/validation/authSchemas";
import {
  requestOtp,
  verifyOtp,
  createAccount,
  refresh,
  logout,
  me,
} from "../controllers/authController";

const router = Router();

router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/create-account", validate(createAccountSchema), createAccount);
router.post("/refresh", validate(refreshTokenSchema), refresh);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);

export default router;
