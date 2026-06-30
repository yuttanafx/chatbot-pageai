import { createClient } from "@supabase/supabase-js";

// ใช้ Service Role key ฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามนำไปใช้ฝั่ง client
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("ยังไม่ได้ตั้งค่า SUPABASE_URL หรือ SUPABASE_SERVICE_ROLE_KEY ใน Environment Variables");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
