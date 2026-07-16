import { Response, NextFunction, Request } from "express";
import { Review } from "../models/Review";
import { Business } from "../models/Business";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

/** Public — customer leaves a review. */
export async function submitReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessId, customerName, rating, comment } = req.body;
    const business = await Business.findById(businessId);
    if (!business) throw new ApiError(404, "Business not found");
    if (rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5");

    const review = await Review.create({ businessId, customerName, rating, comment });
    return res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

export async function listMyReviews(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const reviews = await Review.find({ businessId: business._id }).sort("-createdAt");
    const breakdown = [1, 2, 3, 4, 5].reduce((acc: Record<number, number>, star) => {
      acc[star] = reviews.filter((r) => r.rating === star).length;
      return acc;
    }, {});
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

    return res.status(200).json({ reviews, breakdown, average, total: reviews.length });
  } catch (err) {
    next(err);
  }
}

/** Owner posts one public reply per review. */
export async function replyToReview(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { reply } = req.body;
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const review = await Review.findOne({ _id: req.params.id, businessId: business._id });
    if (!review) throw new ApiError(404, "Review not found");
    if (review.ownerReply) throw new ApiError(409, "This review already has an owner reply");

    review.ownerReply = reply;
    review.ownerRepliedAt = new Date();
    await review.save();
    return res.status(200).json({ review });
  } catch (err) {
    next(err);
  }
}

/** Owner flags a review as inappropriate — goes to admin queue. */
export async function flagReview(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body;
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const review = await Review.findOne({ _id: req.params.id, businessId: business._id });
    if (!review) throw new ApiError(404, "Review not found");

    review.flagged = true;
    review.flagReason = reason ?? "Reported by business owner";
    await review.save();
    return res.status(200).json({ review });
  } catch (err) {
    next(err);
  }
}
