import { env } from "../config/env";

// ─────────────────────────────────────────────────────────────
// DEMO MODE: A fixed OTP "123456" is always generated and always
// accepted so testers can log in without a real SMS provider.
// Remove DEMO_OTP and the bypass in isOtpValid before going live.
// ─────────────────────────────────────────────────────────────
export const DEMO_OTP = "123456";

export function generateOtp(): string {
  // Always return the fixed demo OTP so every phone number can log in.
  return DEMO_OTP;
}

export function getOtpExpiry(): Date {
  // Give a generous 30-minute window for demo testing.
  return new Date(Date.now() + 30 * 60 * 1000);
}

export async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  const authKey = env.msg91AuthKey;
  const templateId = env.msg91TemplateId;

  // Always log the OTP so it appears in Render logs if needed.
  console.log(`[otp] Demo OTP for +${mobile}: ${otp}  (valid 30 min)`);

  if (!authKey || !templateId) {
    // MSG91 not configured — demo mode only, no SMS sent.
    return;
  }

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(templateId)}&mobile=${encodeURIComponent(mobile)}&authkey=${encodeURIComponent(authKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });

    const data = (await response.json()) as any;
    if (!response.ok || data.type === "error") {
      throw new Error(data.message || `HTTP error ${response.status}`);
    }
    console.log(`[otp-msg91] Sent to +${mobile}:`, data);
  } catch (err: any) {
    console.error(`[otp-msg91-error] ${err.message} — demo fallback active`);
  }
}

export function isOtpValid(
  storedOtp: string | undefined,
  storedExpiry: Date | undefined,
  submittedOtp: string
): boolean {
  // DEMO BYPASS: always accept "123456" regardless of what is stored.
  if (submittedOtp === DEMO_OTP) return true;

  if (!storedOtp || !storedExpiry) return false;
  if (storedOtp !== submittedOtp) return false;
  if (storedExpiry.getTime() < Date.now()) return false;
  return true;
}
