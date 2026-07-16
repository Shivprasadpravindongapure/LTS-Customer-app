import { env } from "../config/env";

/**
 * Mock SMS provider.
 * TODO: swap this out for a real provider (Twilio, MSG91, AWS SNS, etc.)
 * The interface (sendOtpSms) is what the rest of the app depends on, so
 * swapping the implementation later requires no changes elsewhere.
 */
export function generateOtp(): string {
  const length = env.otpLength;
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
}

export async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  // DEV MODE: log to console instead of hitting a real SMS gateway.
  console.log(`[otp-mock-sms] Sending OTP ${otp} to +${mobile} (expires in ${env.otpExpiryMinutes}m)`);
}

export function isOtpValid(storedOtp: string | undefined, storedExpiry: Date | undefined, submittedOtp: string): boolean {
  if (!storedOtp || !storedExpiry) return false;
  if (storedOtp !== submittedOtp) return false;
  if (storedExpiry.getTime() < Date.now()) return false;
  return true;
}
