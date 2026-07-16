export type UserRole = "business_owner" | "admin";

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: UserRole;
  isVerified: boolean;
  needsProfile?: boolean;
}

export type PlanTier = "free" | "silver" | "premium";

export interface WorkingHour {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  open: string;
  close: string;
  closed: boolean;
}

export interface Business {
  _id: string;
  ownerId: string;
  name: string;
  category: any;
  subCategory?: any;
  description: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
  };
  photos: string[];
  workingHours: WorkingHour[];
  contactNumbers: string[];
  whatsappEnabled: boolean;
  plan: PlanTier;
  isVerified: boolean;
}

export type EnquiryStatus = "new" | "contacted" | "converted" | "closed";

export interface Enquiry {
  _id: string;
  businessId: string;
  customerName: string;
  customerMobile: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
}

export interface Review {
  _id: string;
  businessId: string;
  customerName: string;
  rating: number;
  comment: string;
  ownerReply?: string;
  flagged: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  parentCategory?: string | null;
  icon?: string;
}
