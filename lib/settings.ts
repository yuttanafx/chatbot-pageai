import { supabaseAdmin } from "./supabase";

export type Settings = {
  shop_name: string;
  system_prompt: string;
  admin_username: string;
  admin_password_hash: string;
  is_setup_done: boolean;
  ai_provider: string;
  anthropic_api_key: string;
  openai_api_key: string;
  gemini_api_key: string;
  facebook_page_access_token: string;
  facebook_verify_token: string;
  line_channel_access_token: string;
  line_channel_secret: string;
};

export async function getSettings(): Promise<Settings> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("shop_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw new Error("ไม่สามารถโหลดการตั้งค่าได้: " + error?.message);
  }
  return data as Settings;
}

export async function updateSettings(patch: Partial<Settings>) {
  const db = supabaseAdmin();
  const { error } = await db
    .from("shop_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) throw new Error("บันทึกการตั้งค่าไม่สำเร็จ: " + error.message);
}
