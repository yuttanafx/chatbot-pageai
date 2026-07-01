import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getShopById } from "@/lib/settings";
import { generateReply, getOrCreateCustomer, saveMessage, getRecentHistory } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: { shopId: string } }) {
  const rawBody   = await req.text();
  const signature = req.headers.get("x-line-signature");

  let shop;
  try {
    shop = await getShopById(params.shopId);
  } catch {
    // shopId ใน URL ไม่ถูกต้อง ไม่พบร้าน
    return NextResponse.json({ ok: true });
  }

  // ตรวจสอบ signature ด้วย secret ของร้านนี้เท่านั้น
  const hash = crypto
    .createHmac("sha256", shop.line_channel_secret)
    .update(rawBody)
    .digest("base64");

  if (hash !== signature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  for (const event of body.events ?? []) {
    if (event.type !== "message" || event.message?.type !== "text") continue;
    const userId = event.source?.userId;
    const text   = event.message?.text;
    if (!userId || !text) continue;

    try {
      const customer = await getOrCreateCustomer(shop.id, "line", userId);
      await saveMessage(customer.id, "user", text);
      const history = await getRecentHistory(customer.id);
      const reply   = await generateReply(shop, history);
      await saveMessage(customer.id, "assistant", reply);

      // ส่งข้อความกลับผ่าน LINE API
      const chunks = (reply.match(/[\s\S]{1,4900}/g) ?? [reply]).slice(0, 5);
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${shop.line_channel_access_token}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: chunks.map((c) => ({ type: "text", text: c })),
        }),
      });
    } catch (err) {
      console.error("LINE webhook error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
