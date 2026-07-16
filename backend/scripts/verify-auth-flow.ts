/**
 * This script exercises the REAL Express app + REAL controllers + REAL
 * middleware end-to-end over HTTP (via supertest), but replaces the
 * mongoose User model's DB calls with an in-memory fake store.
 *
 * Why: this sandbox has no network path to a MongoDB server (egress is
 * restricted to package registries only), so a real `mongod` cannot be
 * started or downloaded here. This script still gives real confidence
 * that the routing, validation, JWT issuance, OTP logic, and controller
 * flow are correct — only the persistence layer is swapped.
 *
 * Run against a real MongoDB (`npm run dev` + Postman/curl) for full
 * end-to-end verification including actual persistence.
 */
import request from "supertest";
import { createApp } from "../src/app";
import { User } from "../src/models/User";

type FakeUserDoc = any;
const store = new Map<string, FakeUserDoc>();
let idCounter = 1;

function makeDoc(data: any): FakeUserDoc {
  const doc: FakeUserDoc = { _id: { toString: () => String(data._id) }, ...data };
  doc.save = async () => {
    store.set(doc.mobile, { ...doc });
    return doc;
  };
  return doc;
}

function fakeQuery(result: any) {
  // mimics a mongoose Query: awaitable, and chainable via .select()
  const q: any = Promise.resolve(result);
  q.select = () => q;
  return q;
}

(User as any).findOne = ({ mobile }: any) => {
  const found = store.get(mobile);
  return fakeQuery(found ? makeDoc(found) : null);
};

(User as any).create = async (data: any) => {
  const id = String(idCounter++);
  const doc = makeDoc({ ...data, _id: id });
  store.set(data.mobile, doc);
  return doc;
};

(User as any).findById = (id: any) => {
  const found = [...store.values()].find((u) => String(u._id) === String(id));
  return fakeQuery(found ? makeDoc(found) : null);
};

(User as any).findByIdAndUpdate = async (id: any, update: any) => {
  const found = [...store.values()].find((u) => String(u._id) === String(id));
  if (found) {
    Object.assign(found, update.$unset ? { refreshTokenHash: undefined } : update);
    store.set(found.mobile, found);
  }
  return found;
};

async function main() {
  const app = createApp();
  let devOtp = "";
  let accessToken = "";
  let refreshToken = "";
  const mobile = "9876543210";

  console.log("1) POST /api/v1/auth/request-otp");
  const r1 = await request(app).post("/api/v1/auth/request-otp").send({ mobile });
  console.log("   status:", r1.status, "body:", r1.body);
  if (r1.status !== 200) throw new Error("request-otp failed");
  devOtp = r1.body.devOtp;

  console.log("2) POST /api/v1/auth/verify-otp");
  const r2 = await request(app).post("/api/v1/auth/verify-otp").send({ mobile, otp: devOtp });
  console.log("   status:", r2.status, "body:", r2.body);
  if (r2.status !== 200) throw new Error("verify-otp failed");
  accessToken = r2.body.accessToken;
  refreshToken = r2.body.refreshToken;

  console.log("3) POST /api/v1/auth/create-account");
  const r3 = await request(app)
    .post("/api/v1/auth/create-account")
    .send({ mobile, name: "Shiv's Travel Agency" });
  console.log("   status:", r3.status, "body:", r3.body);
  if (r3.status !== 200) throw new Error("create-account failed");

  console.log("4) GET /api/v1/auth/me (with access token)");
  const r4 = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`);
  console.log("   status:", r4.status, "body:", r4.body);
  if (r4.status !== 200) throw new Error("me failed");

  console.log("5) GET /api/v1/auth/me with NO token (expect 401)");
  const r5 = await request(app).get("/api/v1/auth/me");
  console.log("   status:", r5.status, "body:", r5.body);
  if (r5.status !== 401) throw new Error("expected 401 without token");

  console.log("6) POST /api/v1/auth/refresh");
  const r6 = await request(app).post("/api/v1/auth/refresh").send({ refreshToken });
  console.log("   status:", r6.status, "body:", { ...r6.body, accessToken: "[hidden]", refreshToken: "[hidden]" });
  if (r6.status !== 200) throw new Error("refresh failed");

  console.log("7) POST /api/v1/auth/request-otp with malformed mobile (expect 400)");
  const r7 = await request(app).post("/api/v1/auth/request-otp").send({ mobile: "abc" });
  console.log("   status:", r7.status, "body:", r7.body);
  if (r7.status !== 400) throw new Error("expected 400 validation error");

  console.log("8) GET /health");
  const r8 = await request(app).get("/health");
  console.log("   status:", r8.status, "body:", r8.body);

  console.log("\nALL CHECKS PASSED ✅");
}

main().catch((err) => {
  console.error("\nVERIFICATION FAILED ❌");
  console.error(err);
  process.exit(1);
});
