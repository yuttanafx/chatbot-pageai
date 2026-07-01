import { cookies } from "next/headers";
import crypto from "crypto";
import { getSettings, updateSettings } from "./settings";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 วัน

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "chatbot_salt_2025").digest("hex");
}

export async function verifyLogin(username: string, password: string): Promise<boolean> {
  const settings = await getSettings();

  // ถ้ายังไม่เคยตั้งค่า (setup ครั้งแรก) ให้ผ่านได้เสมอ
  if (!settings.is_setup_done) return true;

  const hash = hashPassword(password);
  return (
    settings.admin_username === username &&
    settings.admin_password_hash === hash
  );
}

export async function setupFirstAdmin(username: string, password: string) {
  await updateSettings({
    admin_username: username,
    admin_password_hash: hashPassword(password),
    is_setup_done: true,
  });
}

// สร้าง session token จาก username + secret
function makeSessionToken(username: string): string {
  const secret = process.env.SESSION_SECRET || "fallback_secret_change_me";
  return crypto
    .createHmac("sha256", secret)
    .update(username + Date.now().toString().slice(0, -3)) // เปลี่ยนทุกชั่วโมง
    .digest("hex");
}

export function setAuthCookie(username: string) {
  const token = makeSessionToken(username);
  cookies().set(COOKIE_NAME, `${username}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION,
  });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

export function isAuthed(): boolean {
  const c = cookies().get(COOKIE_NAME);
  // ถ้ามี cookie ที่ถูกเซ็ตโดยระบบ (มี : คั่น) ถือว่าผ่าน
  return !!c?.value && c.value.includes(":");
}

export function getAuthedUsername(): string | null {
  const c = cookies().get(COOKIE_NAME);
  if (!c?.value) return null;
  return c.value.split(":")[0] ?? null;
}
