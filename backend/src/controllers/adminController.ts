import { Response, NextFunction } from "express";
import { Business } from "../models/Business";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { Enquiry } from "../models/Enquiry";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

export async function listPendingBusinesses(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const businesses = await Business.find({ isVerified: false }).populate("category subCategory").sort("-createdAt");
    return res.status(200).json({ businesses });
  } catch (err) {
    next(err);
  }
}

export async function approveBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) throw new ApiError(404, "Business not found");
    business.isVerified = true;
    await business.save();
    return res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function rejectBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) throw new ApiError(404, "Business not found");
    await business.deleteOne();
    return res.status(200).json({ message: "Business listing rejected and removed" });
  } catch (err) {
    next(err);
  }
}

export async function listFlaggedReviews(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const reviews = await Review.find({ flagged: true }).populate("businessId").sort("-createdAt");
    return res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
}

export async function resolveFlaggedReview(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { action } = req.body; // "dismiss" | "remove"
    const review = await Review.findById(req.params.id);
    if (!review) throw new ApiError(404, "Review not found");

    if (action === "remove") {
      await review.deleteOne();
      return res.status(200).json({ message: "Review removed" });
    }
    review.flagged = false;
    review.flagReason = undefined;
    await review.save();
    return res.status(200).json({ message: "Flag dismissed", review });
  } catch (err) {
    next(err);
  }
}

export async function platformStats(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const [totalBusinesses, verifiedBusinesses, totalUsers, totalEnquiries, flaggedReviews] = await Promise.all([
      Business.countDocuments({}),
      Business.countDocuments({ isVerified: true }),
      User.countDocuments({}),
      Enquiry.countDocuments({}),
      Review.countDocuments({ flagged: true }),
    ]);

    const planBreakdown = await Business.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]);

    return res.status(200).json({
      totalBusinesses,
      verifiedBusinesses,
      pendingBusinesses: totalBusinesses - verifiedBusinesses,
      totalUsers,
      totalEnquiries,
      flaggedReviews,
      planBreakdown,
    });
  } catch (err) {
    next(err);
  }
}
