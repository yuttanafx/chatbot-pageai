import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSettings } from "@/lib/settings";
import { generateReply, getOrCreateCustomer, saveMessage, getRecentHistory } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get("x-line-signature");
  const settings  = await getSettings();

  // ตรวจสอบ signature
  const hash = crypto
    .createHmac("sha256", settings.line_channel_secret)
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
      const customer = await getOrCreateCustomer("line", userId);
      await saveMessage(customer.id, "user", text);
      const history = await getRecentHistory(customer.id);
      const reply   = await generateReply(history);
      await saveMessage(customer.id, "assistant", reply);

      // ส่งข้อความกลับผ่าน LINE API
      const chunks = (reply.match(/[\s\S]{1,4900}/g) ?? [reply]).slice(0, 5);
      await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.line_channel_access_token}`,
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
