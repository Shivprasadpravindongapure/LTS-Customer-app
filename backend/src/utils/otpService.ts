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
  const authKey = env.msg91AuthKey;
  const templateId = env.msg91TemplateId;

  if (!authKey || !templateId) {
    console.log(`[otp-mock-sms] (MSG91 not configured) Sending OTP ${otp} to +${mobile} (expires in ${env.otpExpiryMinutes}m)`);
    return;
  }

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(mobile)}&authkey=${encodeURIComponent(authKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ otp }),
    });

    const data = await response.json() as any;
    if (!response.ok || data.type === "error") {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    console.log(`[otp-msg91] OTP sent successfully to +${mobile}. MSG91 Response:`, data);
  } catch (err: any) {
    console.error(`[otp-msg91-error] Failed to send OTP via MSG91:`, err.message);
    console.log(`[otp-mock-sms-fallback] Falling back to log. OTP ${otp} for +${mobile} (expires in ${env.otpExpiryMinutes}m)`);
  }
}


export function isOtpValid(storedOtp: string | undefined, storedExpiry: Date | undefined, submittedOtp: string): boolean {
  if (!storedOtp || !storedExpiry) return false;
  if (storedOtp !== submittedOtp) return false;
  if (storedExpiry.getTime() < Date.now()) return false;
  return true;
}
