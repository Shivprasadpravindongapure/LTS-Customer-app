import { Response, NextFunction, Request } from "express";
import { Enquiry } from "../models/Enquiry";
import { Business } from "../models/Business";
import { ApiError } from "../middleware/errorHandler";
import { AuthedRequest } from "../middleware/auth";

/** Public — a customer (consumer app) submits an enquiry. No auth required. */
export async function submitEnquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessId, customerName, customerMobile, message } = req.body;
    const business = await Business.findById(businessId);
    if (!business) throw new ApiError(404, "Business not found");

    const enquiry = await Enquiry.create({ businessId, customerName, customerMobile, message, status: "new" });

    const io = req.app.locals.io;
    if (io) {
      io.to(`business:${businessId}`).emit("new-enquiry", {
        id: enquiry._id,
        customerName: enquiry.customerName,
        message: enquiry.message,
        createdAt: enquiry.createdAt,
      });
    }

    return res.status(201).json({ enquiry });
  } catch (err) {
    next(err);
  }
}

export async function listMyEnquiries(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const page = parseInt((req.query.page as string) ?? "1", 10);
    const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);
    const filter: any = { businessId: business._id };
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Enquiry.find(filter)
        .sort("-createdAt")
        .skip((page - 1) * limit)
        .limit(limit),
      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function updateEnquiryStatus(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "contacted", "converted", "closed"];
    if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status");

    const business = await Business.findOne({ ownerId: req.user!.sub });
    if (!business) throw new ApiError(404, "No business listing yet");

    const enquiry = await Enquiry.findOne({ _id: req.params.id, businessId: business._id });
    if (!enquiry) throw new ApiError(404, "Enquiry not found");

    enquiry.status = status;
    await enquiry.save();
    return res.status(200).json({ enquiry });
  } catch (err) {
    next(err);
  }
}
