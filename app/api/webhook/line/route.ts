import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendLineMessage } from "@/lib/line";
import { generateReply, getOrCreateCustomer, saveMessage, getRecentHistory } from "@/lib/ai";

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return hash === signature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!isValidSignature(rawBody, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  for (const event of body.events ?? []) {
    if (event.type !== "message" || event.message?.type !== "text") continue;

    const userId = event.source?.userId;
    const text = event.message?.text;
    if (!userId || !text) continue;

    try {
      const customer = await getOrCreateCustomer("line", userId);
      await saveMessage(customer.id, "user", text);

      const history = await getRecentHistory(customer.id);
      const reply = await generateReply(history);

      await saveMessage(customer.id, "assistant", reply);
      await sendLineMessage(userId, reply);
    } catch (err) {
      console.error("LINE webhook error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
