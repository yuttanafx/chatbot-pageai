import { supabaseAdmin } from "@/lib/supabase";
import type { Shop } from "@/lib/settings";
import { callAnthropic } from "@/lib/providers/anthropic";
import { callOpenAI } from "@/lib/providers/openai";
import { callGemini } from "@/lib/providers/gemini";
import type { ChatMsg, AiProvider } from "@/lib/providers/types";

const STYLE_PRESETS: Record<string, { temperature: number; tone: string }> = {
  formal: {
    temperature: 0.3,
    tone: "ตอบแบบทางการ สุภาพเรียบร้อย ประโยคครบถ้วน ไม่ใช้คำย่อหรือภาษาพูดจนเกินไป เหมาะกับร้านที่ขายสินค้าพรีเมียม",
  },
  balanced: {
    temperature: 0.6,
    tone: "ตอบแบบสุภาพเป็นกันเอง กระชับ ตรงประเด็น เหมือนพนักงานขายมืออาชีพ",
  },
  natural: {
    temperature: 0.85,
    tone: "ตอบให้เป็นธรรมชาติเหมือนแอดมินจริงกำลังพิมพ์คุยกับลูกค้า ไม่ต้องเป๊ะทุกประโยค อาจมีคำอุทานสั้นๆ เช่น \"เดี๋ยวเช็คให้นะคะ\" แทรกได้บ้าง ใช้คำลงท้ายแบบธรรมชาติ (ค่ะ/ครับ นะคะ/นะครับ) และใส่อิโมจิได้เล็กน้อยเมื่อเหมาะสม",
  },
  casual: {
    temperature: 1.0,
    tone: "ตอบสั้น กระชับ ผ่อนคลายเหมือนแชทกับเพื่อนสนิท ใช้ภาษาพูดง่ายๆ ใส่อิโมจิได้มากขึ้น ไม่ต้องเป็นทางการเลย แต่ยังคงความสุภาพพื้นฐานไว้",
  },
};

export async function generateReply(shop: Shop, history: ChatMsg[]): Promise<string> {
  const db = supabaseAdmin();

  const { data: products } = await db
    .from("products")
    .select("name, description, price, stock")
    .eq("shop_id", shop.id)
    .eq("is_active", true);

  const productList = (products ?? [])
    .map((p) => `- ${p.name} | ราคา ${p.price} บาท | คงเหลือ ${p.stock} ชิ้น | ${p.description ?? ""}`)
    .join("\n");

  const style = STYLE_PRESETS[shop.ai_style] ?? STYLE_PRESETS.balanced;

  const systemPrompt = `คุณคือพนักงานขายแชทของร้าน "${shop.shop_name}" หน้าที่ของคุณคือตอบคำถามลูกค้า แนะนำสินค้าที่เหมาะสม และพยายามปิดการขายอย่างเป็นธรรมชาติ ไม่ยัดเยียด

กฎการตอบ:
- ตอบเป็นภาษาไทย ${style.tone} ไม่ใช้ bullet ยาวๆ
- ใช้ข้อมูลสินค้าด้านล่างเท่านั้น ห้ามมั่ว ราคาหรือสต็อกที่ไม่มีในรายการ
- ถ้าลูกค้าสนใจซื้อ ให้ถามข้อมูลที่จำเป็น (เช่น จำนวน ที่อยู่จัดส่ง) เพื่อพาไปสู่การปิดการขาย
- ถ้าสินค้าหมดสต็อก ให้แจ้งตามจริงและเสนอสินค้าใกล้เคียงแทน
- ถ้าไม่แน่ใจหรือคำถามอยู่นอกเหนือสินค้า ให้แจ้งว่าจะส่งต่อให้แอดมินตรวจสอบ

รายการสินค้าปัจจุบัน:
${productList || "(ยังไม่มีสินค้าในระบบ)"}

${shop.system_prompt}`;

  const provider = (shop.ai_provider as AiProvider) || "anthropic";

  try {
    if (provider === "openai")   return await callOpenAI(shop.openai_api_key, systemPrompt, history, style.temperature);
    if (provider === "gemini")   return await callGemini(shop.gemini_api_key, systemPrompt, history, style.temperature);
    return await callAnthropic(shop.anthropic_api_key, systemPrompt, history, style.temperature);
  } catch (err) {
    console.error(`AI provider (${provider}) error:`, err);
    return "ขอโทษค่ะ ตอนนี้ระบบขัดข้อง รบกวนลองใหม่อีกครั้งนะคะ";
  }
}

export type { ChatMsg };

export async function getOrCreateCustomer(shopId: string, platform: "facebook" | "line", platformUserId: string, displayName?: string) {
  const db = supabaseAdmin();
  const { data: existing } = await db
    .from("customers").select("*")
    .eq("shop_id", shopId)
    .eq("platform", platform).eq("platform_user_id", platformUserId).maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await db
    .from("customers")
    .insert({ shop_id: shopId, platform, platform_user_id: platformUserId, display_name: displayName ?? null })
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
