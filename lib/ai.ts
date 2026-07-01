import { supabaseAdmin } from "@/lib/supabase";
import { getSettings } from "@/lib/settings";
import { callAnthropic } from "@/lib/providers/anthropic";
import { callOpenAI } from "@/lib/providers/openai";
import { callGemini } from "@/lib/providers/gemini";
import type { ChatMsg, AiProvider } from "@/lib/providers/types";

export async function generateReply(history: ChatMsg[]): Promise<string> {
  const db = supabaseAdmin();

  const [{ data: products }, settings] = await Promise.all([
    db.from("products").select("name, description, price, stock").eq("is_active", true),
    getSettings(),
  ]);

  const productList = (products ?? [])
    .map((p) => `- ${p.name} | ราคา ${p.price} บาท | คงเหลือ ${p.stock} ชิ้น | ${p.description ?? ""}`)
    .join("\n");

  const systemPrompt = `คุณคือพนักงานขายแชทของร้าน "${settings.shop_name}" หน้าที่ของคุณคือตอบคำถามลูกค้า แนะนำสินค้าที่เหมาะสม และพยายามปิดการขายอย่างเป็นธรรมชาติ ไม่ยัดเยียด

กฎการตอบ:
- ตอบเป็นภาษาไทย สุภาพ เป็นกันเอง กระชับ เหมือนแชทคุยกับคนจริง ไม่ใช้ bullet ยาวๆ
- ใช้ข้อมูลสินค้าด้านล่างเท่านั้น ห้ามมั่ว ราคาหรือสต็อกที่ไม่มีในรายการ
- ถ้าลูกค้าสนใจซื้อ ให้ถามข้อมูลที่จำเป็น (เช่น จำนวน ที่อยู่จัดส่ง) เพื่อพาไปสู่การปิดการขาย
- ถ้าสินค้าหมดสต็อก ให้แจ้งตามจริงและเสนอสินค้าใกล้เคียงแทน
- ถ้าไม่แน่ใจหรือคำถามอยู่นอกเหนือสินค้า ให้แจ้งว่าจะส่งต่อให้แอดมินตรวจสอบ

รายการสินค้าปัจจุบัน:
${productList || "(ยังไม่มีสินค้าในระบบ)"}

${settings.system_prompt}`;

  const provider = (settings.ai_provider as AiProvider) || "anthropic";

  try {
    if (provider === "openai")   return await callOpenAI(settings.openai_api_key, systemPrompt, history);
    if (provider === "gemini")   return await callGemini(settings.gemini_api_key, systemPrompt, history);
    return await callAnthropic(settings.anthropic_api_key, systemPrompt, history);
  } catch (err) {
    console.error(`AI provider (${provider}) error:`, err);
    return "ขอโทษค่ะ ตอนนี้ระบบขัดข้อง รบกวนลองใหม่อีกครั้งนะคะ";
  }
}

export type { ChatMsg };

export async function getOrCreateCustomer(platform: "facebook" | "line", platformUserId: string, displayName?: string) {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("customers").select("*")
    .eq("platform", platform).eq("platform_user_id", platformUserId).maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await db
    .from("customers")
    .insert({ platform, platform_user_id: platformUserId, display_name: displayName ?? null })
    .select().single();

  if (error) throw error;
  return created;
}

export async function saveMessage(customerId: string, role: "user" | "assistant", content: string) {
  const db = supabaseAdmin();
  await db.from("messages").insert({ customer_id: customerId, role, content });
}

export async function getRecentHistory(customerId: string, limit = 12): Promise<ChatMsg[]> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("messages").select("role, content")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false }).limit(limit);

  return (data ?? []).reverse() as ChatMsg[];
}
