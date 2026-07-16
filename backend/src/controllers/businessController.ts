import { Response, NextFunction } from "express";
import { Business } from "../models/Business";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";
import { publicUrlFor } from "../utils/upload";

const PLAN_PHOTO_LIMITS: Record<string, number> = { free: 5, silver: 15, premium: Infinity };

export async function createBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const ownerId = req.user!.sub;
    const existing = await Business.findOne({ ownerId });
    if (existing) throw new ApiError(409, "You already have a business listing. Use update instead.");

    const business = await Business.create({ ...req.body, ownerId, isVerified: false });
    return res.status(201).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function getMyBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub }).populate("category subCategory");
    if (!business) throw new ApiError(404, "No business listing yet");
    return res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function updateMyBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");
    Object.assign(business, req.body);
    await business.save();
    return res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

export async function uploadPhotos(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const files = (req.files as Express.Multer.File[]) ?? [];
    const limit = PLAN_PHOTO_LIMITS[business.plan] ?? 5;
    if (business.photos.length + files.length > limit) {
      throw new ApiError(
        403,
        `Your ${business.plan} plan allows up to ${limit === Infinity ? "unlimited" : limit} photos. Upgrade to add more.`
      );
    }

    const urls = files.map((f) => publicUrlFor(f.filename));
    business.photos.push(...urls);
    await business.save();
    return res.status(200).json({ photos: business.photos });
  } catch (err) {
    next(err);
  }
}

export async function reorderPhotos(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { photos } = req.body as { photos: string[] };
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const currentSet = new Set(business.photos);
    const incomingSet = new Set(photos);
    const sameSet = currentSet.size === incomingSet.size && [...currentSet].every((p) => incomingSet.has(p));
    if (!sameSet) throw new ApiError(400, "Reordered list must contain exactly the existing photos");

    business.photos = photos;
    await business.save();
    return res.status(200).json({ photos: business.photos });
  } catch (err) {
    next(err);
  }
}

export async function deletePhoto(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { url } = req.params as any;
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");
    business.photos = business.photos.filter((p) => p !== decodeURIComponent(url));
    await business.save();
    return res.status(200).json({ photos: business.photos });
  } catch (err) {
    next(err);
  }
}

/** Public preview — exactly what the consumer app would show. No auth required. */
export async function previewBusiness(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findById(req.params.id).populate("category subCategory");
    if (!business || !business.isVerified) throw new ApiError(404, "Listing not found");
    return res.status(200).json({ business });
  } catch (err) {
    next(err);
  }
}

/** Public search/list — used by consumer app; also usable by admin without owner filter. */
export async function listBusinesses(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);
    const filter: any = { isVerified: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.city) filter["address.city"] = req.query.city;
    if (req.query.q) filter.$text = { $search: req.query.q as string };

    const sort = (req.query.sort as string) ?? "-createdAt";

    const [items, total] = await Promise.all([
      Business.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Business.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}
