import { NextRequest, NextResponse } from "next/server";
import { isAuthed, getAuthedShopId, hashPassword } from "@/lib/auth";
import { getShopById, updateShop } from "@/lib/settings";

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const shopId = getAuthedShopId();
  if (!shopId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const s = await getShopById(shopId);

  // ซ่อน key จริง — ส่งแค่ว่าตั้งค่าไว้แล้วหรือยัง + 4 ตัวสุดท้าย
  function maskKey(key: string) {
    if (!key) return "";
    return "•".repeat(Math.max(0, key.length - 4)) + key.slice(-4);
  }

  return NextResponse.json({
    shop_id: s.id,
    shop_name: s.shop_name,
    system_prompt: s.system_prompt,
    admin_username: s.admin_username,
    ai_provider: s.ai_provider,
    ai_style: s.ai_style,
    anthropic_api_key: maskKey(s.anthropic_api_key),
    openai_api_key: maskKey(s.openai_api_key),
    gemini_api_key: maskKey(s.gemini_api_key),
    facebook_page_access_token: maskKey(s.facebook_page_access_token),
    facebook_verify_token: maskKey(s.facebook_verify_token),
    line_channel_access_token: maskKey(s.line_channel_access_token),
    line_channel_secret: maskKey(s.line_channel_secret),
  });
}

export async function PUT(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const shopId = getAuthedShopId();
  if (!shopId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const patch: Record<string, any> = {};

  // ข้อมูลร้านและ AI
  if (body.shop_name     !== undefined) patch.shop_name     = body.shop_name;
  if (body.system_prompt !== undefined) patch.system_prompt = body.system_prompt;
  if (body.ai_provider   !== undefined) patch.ai_provider   = body.ai_provider;
  if (body.ai_style      !== undefined) patch.ai_style      = body.ai_style;

  // API keys — บันทึกเฉพาะถ้าไม่ใช่ค่า masked (•••)
  const rawFields = [
    "anthropic_api_key", "openai_api_key", "gemini_api_key",
    "facebook_page_access_token", "facebook_verify_token",
    "line_channel_access_token", "line_channel_secret",
  ];
  for (const f of rawFields) {
    const val = body[f];
    if (val !== undefined && val !== "" && !val.includes("•")) {
      patch[f] = val;
    }
  }

  // เปลี่ยนรหัสผ่าน Admin ของร้านนี้
  if (body.new_username && body.new_password) {
    patch.admin_username      = body.new_username;
    patch.admin_password_hash = hashPassword(body.new_password);
  }

  try {
    await updateShop(shopId, patch);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
