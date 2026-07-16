import { Response, NextFunction } from "express";
import { Business } from "../models/Business";
import { Subscription } from "../models/Subscription";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

export const PLAN_CATALOG = [
  {
    plan: "free",
    priceInr: 0,
    photoLimit: 5,
    topPlacement: false,
    features: ["Basic listing", "Up to 5 photos", "Enquiry inbox"],
  },
  {
    plan: "silver",
    priceInr: 499,
    photoLimit: 15,
    topPlacement: false,
    features: ["Everything in Free", "Up to 15 photos", "Analytics dashboard"],
  },
  {
    plan: "premium",
    priceInr: 1499,
    photoLimit: null, // unlimited
    topPlacement: true,
    features: ["Everything in Silver", "Unlimited photos", "Top placement in search", "Priority support"],
  },
] as const;

export function getPlanCatalog(req: AuthedRequest, res: Response) {
  return res.status(200).json({ plans: PLAN_CATALOG });
}

/**
 * POST /subscriptions/checkout
 * Body: { plan }
 * Stub payment flow: in production this would create a Razorpay/Stripe
 * order and return a client_secret / order_id for the RN app's payment
 * SDK to complete. Here we mark it "pending" then instantly "activate"
 * it, clearly marked as a mock so swapping in a real gateway later is a
 * contained change (see paymentProvider field on the Subscription model).
 */
export async function checkoutPlan(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { plan } = req.body;
    if (!["free", "silver", "premium"].includes(plan)) throw new ApiError(400, "Invalid plan");

    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    // TODO(real payments): replace this block with a Razorpay/Stripe order
    // creation call, return their client-facing token, and only flip
    // Subscription.status to "active" from a verified webhook — not here.
    const subscription = await Subscription.create({
      businessId: business._id,
      plan,
      startDate: new Date(),
      endDate: plan === "free" ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "active",
      paymentProvider: "mock",
      paymentReference: `MOCK-${Date.now()}`,
    });

    business.plan = plan;
    await business.save();

    return res.status(200).json({
      message: plan === "free" ? "Switched to Free plan" : "Payment simulated — plan activated (mock gateway)",
      subscription,
      business,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMySubscription(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const subscription = await Subscription.findOne({ businessId: business._id }).sort("-createdAt");
    return res.status(200).json({ subscription, currentPlan: business.plan });
  } catch (err) {
    next(err);
  }
}
