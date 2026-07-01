import { supabaseAdmin } from "./supabase";

export type Shop = {
  id: string;
  shop_name: string;
  system_prompt: string;
  admin_username: string;
  admin_password_hash: string;
  ai_provider: string;
  ai_style: string;
  anthropic_api_key: string;
  openai_api_key: string;
  gemini_api_key: string;
  facebook_page_access_token: string;
  facebook_verify_token: string;
  line_channel_access_token: string;
  line_channel_secret: string;
};

export async function getShopById(shopId: string): Promise<Shop> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (error || !data) {
    throw new Error("ไม่พบร้านค้านี้ในระบบ: " + error?.message);
  }
  return data as Shop;
}

export async function updateShop(shopId: string, patch: Partial<Shop>) {
  const db = supabaseAdmin();
  const { error } = await db
    .from("shops")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", shopId);

  if (error) throw new Error("บันทึกการตั้งค่าไม่สำเร็จ: " + error.message);
}
