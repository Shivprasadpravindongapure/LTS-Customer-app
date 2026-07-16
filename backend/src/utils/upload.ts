import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// TODO: when env.useS3 is true, swap this diskStorage for a multer-s3
// storage engine using env.awsRegion / env.awsBucket / AWS creds.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|webp)/.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error("Only jpeg/png/webp images allowed"));
  },
});

export function publicUrlFor(filename: string): string {
  return `/uploads/${filename}`;
}

export const _useS3Flag = env.useS3; // referenced so TODO above is discoverable
