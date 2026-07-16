import { api } from "./client";

export const authApi = {
  requestOtp: (mobile: string) => api.post("/auth/request-otp", { mobile }),
  verifyOtp: (mobile: string, otp: string) => api.post("/auth/verify-otp", { mobile, otp }),
  createAccount: (mobile: string, name: string) => api.post("/auth/create-account", { mobile, name }),
  me: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const categoryApi = {
  list: () => api.get("/categories"),
};

export const businessApi = {
  getMine: () => api.get("/businesses/me/mine"),
  create: (payload: any) => api.post("/businesses", payload),
  update: (payload: any) => api.patch("/businesses/me/mine", payload),
  uploadPhotos: (formData: FormData) =>
    api.post("/businesses/me/photos", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  reorderPhotos: (photos: string[]) => api.patch("/businesses/me/photos/reorder", { photos }),
  deletePhoto: (url: string) => api.delete(`/businesses/me/photos/${encodeURIComponent(url)}`),
  preview: (id: string) => api.get(`/businesses/${id}/preview`),
  analytics: (range: 7 | 30 | 90) => api.get(`/businesses/me/analytics?range=${range}`),
};

export const enquiryApi = {
  listMine: (status?: string) => api.get("/enquiries/mine", { params: { status } }),
  updateStatus: (id: string, status: string) => api.patch(`/enquiries/${id}/status`, { status }),
};

export const reviewApi = {
  listMine: () => api.get("/reviews/mine"),
  reply: (id: string, reply: string) => api.patch(`/reviews/${id}/reply`, { reply }),
  flag: (id: string, reason?: string) => api.patch(`/reviews/${id}/flag`, { reason }),
};

export const subscriptionApi = {
  plans: () => api.get("/subscriptions/plans"),
  mine: () => api.get("/subscriptions/mine"),
  checkout: (plan: "free" | "silver" | "premium") => api.post("/subscriptions/checkout", { plan }),
};

export const adminApi = {
  pendingBusinesses: () => api.get("/admin/businesses/pending"),
  approveBusiness: (id: string) => api.patch(`/admin/businesses/${id}/approve`),
  rejectBusiness: (id: string) => api.delete(`/admin/businesses/${id}/reject`),
  flaggedReviews: () => api.get("/admin/reviews/flagged"),
  resolveReview: (id: string, action: "dismiss" | "remove") => api.patch(`/admin/reviews/${id}/resolve`, { action }),
  stats: () => api.get("/admin/stats"),
};
