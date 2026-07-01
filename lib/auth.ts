import { cookies } from "next/headers";
import crypto from "crypto";
import { supabaseAdmin } from "./supabase";

const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 วัน

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "chatbot_salt_2025").digest("hex");
}

// ตรวจสอบ login — คืนค่า shopId ถ้าถูกต้อง, null ถ้าผิด
export async function verifyLogin(username: string, password: string): Promise<{ shopId: string } | null> {
  const db = supabaseAdmin();
  const { data: shop } = await db
    .from("shops")
    .select("id, admin_password_hash")
    .eq("admin_username", username)
    .maybeSingle();

  if (!shop) return null;
  if (shop.admin_password_hash !== hashPassword(password)) return null;
  return { shopId: shop.id };
}

// สร้างร้านใหม่ (สมัครสมาชิกใหม่) — คืนค่า shopId ที่สร้าง
export async function createShop(username: string, password: string, shopName?: string): Promise<string> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shops")
    .insert({
      admin_username: username,
      admin_password_hash: hashPassword(password),
      shop_name: shopName?.trim() || "ร้านค้าของฉัน",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

// สร้าง session token จาก shopId + username + secret
function makeSessionToken(shopId: string, username: string): string {
  const secret = process.env.SESSION_SECRET || "fallback_secret_change_me";
  return crypto
    .createHmac("sha256", secret)
    .update(shopId + ":" + username + Date.now().toString().slice(0, -3)) // เปลี่ยนทุกชั่วโมง
    .digest("hex");
}

export function setAuthCookie(shopId: string, username: string) {
  const token = makeSessionToken(shopId, username);
  cookies().set(COOKIE_NAME, `${shopId}:${username}:${token}`, {
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
  return !!c?.value && c.value.split(":").length === 3;
}

export function getAuthedShopId(): string | null {
  const c = cookies().get(COOKIE_NAME);
  if (!c?.value) return null;
  return c.value.split(":")[0] ?? null;
}

export function getAuthedUsername(): string | null {
  const c = cookies().get(COOKIE_NAME);
  if (!c?.value) return null;
  return c.value.split(":")[1] ?? null;
}
