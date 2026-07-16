import { Response, NextFunction } from "express";
import { Business } from "../models/Business";
import { Enquiry } from "../models/Enquiry";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

/**
 * GET /businesses/me/analytics?range=7|30|90
 * Profile views aren't tracked yet by a dedicated event log (would need a
 * ProfileView collection populated from the consumer app's detail-screen
 * hit), so this endpoint returns real enquiry-derived metrics now and a
 * clearly-labeled placeholder for views until that instrumentation exists.
 */
export async function getAnalytics(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const range = parseInt((req.query.range as string) ?? "7", 10);
    if (![7, 30, 90].includes(range)) throw new ApiError(400, "range must be 7, 30, or 90");

    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const since = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
    const enquiries = await Enquiry.find({ businessId: business._id, createdAt: { $gte: since } });

    const converted = enquiries.filter((e) => e.status === "converted").length;
    const conversionRate = enquiries.length ? Math.round((converted / enquiries.length) * 100) : 0;

    // Bucket enquiries by day for a simple line/bar chart on the client.
    const buckets: Record<string, number> = {};
    for (let i = 0; i < range; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const e of enquiries) {
      const key = e.createdAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += 1;
    }

    return res.status(200).json({
      range,
      enquiryCount: enquiries.length,
      conversionRate,
      enquiriesByDay: Object.entries(buckets)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, count]) => ({ date, count })),
      profileViews: {
        note: "TODO: instrument consumer-app profile views into a ProfileView collection; placeholder value below",
        value: 0,
      },
    });
  } catch (err) {
    next(err);
  }
}
