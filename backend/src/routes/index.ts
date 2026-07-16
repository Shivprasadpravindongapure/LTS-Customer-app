import { Router } from "express";
import authRoutes from "./authRoutes";
import businessRoutes from "./businessRoutes";
import enquiryRoutes from "./enquiryRoutes";
import reviewRoutes from "./reviewRoutes";
import categoryRoutes from "./categoryRoutes";
import subscriptionRoutes from "./subscriptionRoutes";
import adminRoutes from "./adminRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/businesses", businessRoutes);
router.use("/enquiries", enquiryRoutes);
router.use("/reviews", reviewRoutes);
router.use("/categories", categoryRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/admin", adminRoutes);

export default router;
