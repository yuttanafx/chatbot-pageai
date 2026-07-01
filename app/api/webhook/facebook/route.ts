import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { generateReply, getOrCreateCustomer, saveMessage, getRecentHistory } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const settings = await getSettings();

  if (mode === "subscribe" && token === settings.facebook_verify_token) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.object !== "page") return NextResponse.json({ ok: true });

  const settings = await getSettings();

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text     = event.message?.text;
      if (!senderId || !text || event.message?.is_echo) continue;

      try {
        const customer = await getOrCreateCustomer("facebook", senderId);
        await saveMessage(customer.id, "user", text);
        const history = await getRecentHistory(customer.id);
        const reply   = await generateReply(history);
        await saveMessage(customer.id, "assistant", reply);

        // ส่งข้อความกลับผ่าน Facebook API
        const chunks = reply.match(/[\s\S]{1,1900}/g) ?? [reply];
        for (const chunk of chunks) {
          await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${settings.facebook_page_access_token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: chunk },
              messaging_type: "RESPONSE",
            }),
          });
        }
      } catch (err) {
        console.error("Facebook webhook error:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
