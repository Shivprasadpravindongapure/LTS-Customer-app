# Local Trade Street (LTS) — Business CRM

A companion app for business owners on the LTS hyperlocal directory to manage
their listing, leads, reviews, subscription plan, and analytics — plus a
lightweight admin surface for platform staff.

```
lts-app/
├── backend/   Express + TypeScript + MongoDB API
└── mobile/    Expo (React Native + TypeScript) app
```

## Status vs. the original build order

| # | Milestone | Status |
|---|---|---|
| 1 | Backend skeleton: Express + Mongo + JWT + OTP | ✅ Done, verified |
| 2 | RN app skeleton: nav shell, auth wired to real backend | ✅ Done, verified (bundles clean) |
| 3 | Business profile CRUD + image upload | ✅ Done |
| 4 | Enquiry module + Socket.IO real-time notification | ✅ Done |
| 5 | Reviews module + owner reply | ✅ Done |
| 6 | Subscription/plan screens + gating logic | ✅ Done (mock payment) |
| 7 | Analytics dashboard | ✅ Done (enquiry-derived; profile views stubbed, see below) |
| 8 | Admin role screens | ✅ Done |
| 9 | Polish: loading/error/empty states, pull-to-refresh | ⚠️ Partial — loading/error/empty states are in on every screen; pull-to-refresh is not yet wired on the list screens |
| 10 | Env config, README, seed script | ✅ This file + `backend/src/utils/seed.ts` |

## Important limitation: no live MongoDB in the build sandbox

This was built in a sandboxed container with **no network path to any MongoDB
server** (egress is restricted to package registries only — npm, pip, apt,
GitHub). That means:

- Everything was **type-checked cleanly** (`npm run typecheck` in `backend/`).
- The real Express server was **booted and hit over HTTP** — `/health` and
  public routes (e.g. `/api/v1/subscriptions/plans`) were confirmed working,
  and DB-backed routes correctly return a clear error when Mongo is
  unreachable rather than crashing.
- The full **auth flow (request-otp → verify-otp → create-account → me →
  refresh → 401-without-token)** was exercised through the real Express
  routes and controllers, with only the Mongoose `User` model's DB calls
  swapped for an in-memory fake (see `backend/scripts/verify-auth-flow.ts`)
  — everything else (routing, validation, JWT issuance, OTP logic, auth
  middleware) is real.
- The RN app was **bundled end-to-end with Metro** (`npx expo export`,
  1046 modules, zero errors) — confirming navigation, Redux, and all screen
  imports resolve and compile correctly.
- What's **not** independently verified here: business/enquiry/review/admin
  controllers against a real database, and the RN screens rendered on an
  actual simulator/device (no emulator available in this sandbox either).

**Once you have a real MongoDB reachable** (local `mongod`, Docker, or Atlas),
run the steps below — the code doesn't change, only `MONGO_URI` does.

## Backend setup

```bash
cd backend
npm install
cp .env.example .env      # edit MONGO_URI etc. if needed
npm run typecheck         # confirm it still compiles in your environment
npm run seed               # populates demo categories/business/enquiries/reviews
npm run dev                 # starts on http://localhost:4000
```

Verify it's alive: `curl http://localhost:4000/health`

Run the DB-independent auth-flow check any time (works even without Mongo):
```bash
npx ts-node --transpile-only scripts/verify-auth-flow.ts
```

### Environment variables (`backend/.env`)

| Var | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets — change in production |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `OTP_EXPIRY_MINUTES` / `OTP_LENGTH` | OTP behavior |
| `USE_S3` / `AWS_*` | Set `USE_S3=true` and fill AWS_* to switch photo uploads from local disk to S3 (currently a TODO in `src/utils/upload.ts`) |
| `CLIENT_ORIGIN` | CORS origin for the RN app |

### Demo login (after `npm run seed`)

- **Business owner:** mobile `9999999999`
- **Admin:** mobile `8888888888`

Auth is OTP-based, not password-based — call `POST /api/v1/auth/request-otp`
with the mobile number above. In development the response includes a
`devOtp` field (and it's also logged to the server console) so you don't
need a real SMS provider to test.

## Mobile app setup

```bash
cd mobile
npm install
npx expo start
```

By default the app points at `http://localhost:4000`. To change it, set
`EXPO_PUBLIC_API_URL` (e.g. in an `.env` file read by Expo, or inline):

- iOS simulator: `http://localhost:4000` (default)
- Android emulator: `http://10.0.2.2:4000`
- Physical device: `http://<your-machine-LAN-IP>:4000`

## Product decisions made where the spec/screens were ambiguous

- **Location selection** in onboarding was simplified to city/state/country
  text fields tied to the business address, rather than a separate
  country→state→city picker flow with device GPS — the `Business.location`
  GeoJSON field is still there (2dsphere-indexed) for map-based search later.
- **Profile views** in analytics aren't tracked yet — that requires an event
  log written from the *consumer* app's listing-detail screen, which is out
  of scope for the CRM app being built here. The endpoint returns real
  enquiry-derived metrics (count, conversion rate, daily breakdown) and a
  clearly-labeled `0` placeholder for views.
- **Payments** are mocked end-to-end (`Subscription.paymentProvider: "mock"`).
  Swapping in Razorpay/Stripe means: (1) create a real order in
  `checkoutPlan`, (2) return the client-facing token instead of instantly
  marking `active`, and (3) flip `Subscription.status` to `active` from a
  verified webhook, not from the checkout request itself.
- **Photo storage** defaults to local disk (`backend/uploads`, served at
  `/uploads/...`) with a clearly marked TODO to swap in S3 via
  `USE_S3=true` — multer's storage engine is the only thing that needs
  to change.
- **One reply per review**: enforced server-side (409 if a reply already
  exists), matching "owner can post a public reply (one reply per review)".

## API reference

A Postman collection isn't included yet — the route list below plus each
controller's JSDoc comment documents the contract. All routes are under
`/api/v1`.

```
POST   /auth/request-otp
POST   /auth/verify-otp
POST   /auth/create-account
POST   /auth/refresh
POST   /auth/logout                (auth)
GET    /auth/me                    (auth)

GET    /businesses                 (public, search/list)
GET    /businesses/:id/preview     (public)
POST   /businesses                 (auth, owner)
GET    /businesses/me/mine         (auth, owner)
PATCH  /businesses/me/mine         (auth, owner)
POST   /businesses/me/photos       (auth, owner, multipart)
PATCH  /businesses/me/photos/reorder (auth, owner)
DELETE /businesses/me/photos/:url  (auth, owner)
GET    /businesses/me/analytics    (auth, owner)

POST   /enquiries                  (public, from consumer app)
GET    /enquiries/mine             (auth, owner)
PATCH  /enquiries/:id/status       (auth, owner)

POST   /reviews                    (public, from consumer app)
GET    /reviews/mine               (auth, owner)
PATCH  /reviews/:id/reply          (auth, owner)
PATCH  /reviews/:id/flag           (auth, owner)

GET    /categories                 (public)
POST   /categories                 (auth, admin)
DELETE /categories/:id             (auth, admin)

GET    /subscriptions/plans        (public)
GET    /subscriptions/mine         (auth, owner)
POST   /subscriptions/checkout     (auth, owner)

GET    /admin/businesses/pending   (auth, admin)
PATCH  /admin/businesses/:id/approve (auth, admin)
DELETE /admin/businesses/:id/reject  (auth, admin)
GET    /admin/reviews/flagged      (auth, admin)
PATCH  /admin/reviews/:id/resolve  (auth, admin)
GET    /admin/stats                (auth, admin)
```

## Real-time notifications

The RN app connects to Socket.IO on app boot (once a business exists) and
joins room `business:<businessId>`. When a consumer submits an enquiry via
`POST /enquiries`, the backend emits `new-enquiry` to that room, and the
Leads screen refetches. This is the simplest correct implementation; a
further optimization would be to merge the pushed payload directly into
state instead of refetching.
