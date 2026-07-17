import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/lts_crm"),

  jwtAccessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? "5", 10),
  otpLength: parseInt(process.env.OTP_LENGTH ?? "6", 10),

  useS3: (process.env.USE_S3 ?? "false") === "true",
  awsRegion: process.env.AWS_REGION ?? "",
  awsBucket: process.env.AWS_S3_BUCKET ?? "",

  clientOrigin: process.env.CLIENT_ORIGIN ?? "*",

  msg91AuthKey: process.env.MSG91_AUTH_KEY ?? "",
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID ?? "",
};

