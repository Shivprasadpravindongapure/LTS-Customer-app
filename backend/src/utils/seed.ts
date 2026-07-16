import { connectDB, disconnectDB } from "../config/db";
import { env } from "../config/env";
import { User } from "../models/User";
import { Business } from "../models/Business";
import { Category } from "../models/Category";
import { Enquiry } from "../models/Enquiry";
import { Review } from "../models/Review";
import { Subscription } from "../models/Subscription";
import bcrypt from "bcryptjs";

async function seed() {
  await connectDB(env.mongoUri);
  console.log("[seed] connected, clearing existing demo data...");

  await Promise.all([
    User.deleteMany({}),
    Business.deleteMany({}),
    Category.deleteMany({}),
    Enquiry.deleteMany({}),
    Review.deleteMany({}),
    Subscription.deleteMany({}),
  ]);

  const travel = await Category.create({ name: "Travel Agents", icon: "plane" });
  const pest = await Category.create({ name: "Pest Control", icon: "bug" });
  await Category.create({ name: "Home Services", icon: "home", parentCategory: null });
  const domestic = await Category.create({ name: "Domestic Tours", parentCategory: travel._id });

  const owner = await User.create({
    name: "Demo Owner",
    mobile: "9999999999",
    role: "business_owner",
    isVerified: true,
    passwordHash: await bcrypt.hash("demo1234", 10),
  });

  const admin = await User.create({
    name: "Demo Admin",
    mobile: "8888888888",
    role: "admin",
    isVerified: true,
    passwordHash: await bcrypt.hash("admin1234", 10),
  });

  const business = await Business.create({
    ownerId: owner._id,
    name: "Shiv's Travel Agency",
    category: travel._id,
    subCategory: domestic._id,
    description: "Domestic and international travel packages, visa assistance, and holiday planning.",
    address: {
      line1: "12 MG Road",
      city: "Jalgaon",
      state: "Maharashtra",
      country: "India",
      pincode: "425001",
    },
    location: { type: "Point", coordinates: [75.5626, 21.0077] },
    photos: [],
    workingHours: ["mon", "tue", "wed", "thu", "fri", "sat"].map((day) => ({
      day,
      open: "10:00",
      close: "19:00",
      closed: false,
    })),
    contactNumbers: ["9999999999"],
    whatsappEnabled: true,
    plan: "free",
    isVerified: true,
  });

  await Subscription.create({
    businessId: business._id,
    plan: "free",
    startDate: new Date(),
    status: "active",
  });

  await Enquiry.create([
    {
      businessId: business._id,
      customerName: "Ananya Sharma",
      customerMobile: "9123456780",
      message: "Looking for a 4N/5D Goa package for a family of 4.",
      status: "new",
    },
    {
      businessId: business._id,
      customerName: "Rahul Verma",
      customerMobile: "9123456781",
      message: "Do you help with Schengen visa appointments?",
      status: "contacted",
    },
  ]);

  await Review.create([
    {
      businessId: business._id,
      customerName: "Pooja Desai",
      rating: 5,
      comment: "Excellent service, very responsive!",
    },
    {
      businessId: business._id,
      customerName: "Karan Mehta",
      rating: 2,
      comment: "Pricing was unclear upfront.",
      flagged: false,
    },
  ]);

  console.log("[seed] done. Demo login: mobile 9999999999 (owner) / 8888888888 (admin) — use OTP flow, devOtp is echoed in dev.");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
