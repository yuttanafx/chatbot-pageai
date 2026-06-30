import { NextRequest, NextResponse } from "next/server";
import { sendFacebookMessage } from "@/lib/facebook";
import { generateReply, getOrCreateCustomer, saveMessage, getRecentHistory } from "@/lib/ai";

// Facebook ใช้ยืนยัน webhook ตอนตั้งค่าครั้งแรกใน Meta App Dashboard
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.object !== "page") {
    return NextResponse.json({ ok: true });
  }

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderId = event.sender?.id;
      const text = event.message?.text;

      // ข้ามข้อความที่ไม่ใช่ข้อความตัวอักษร (เช่น echo, read receipt, sticker)
      if (!senderId || !text || event.message?.is_echo) continue;

      try {
        const customer = await getOrCreateCustomer("facebook", senderId);
        await saveMessage(customer.id, "user", text);

        const history = await getRecentHistory(customer.id);
        const reply = await generateReply(history);

        await saveMessage(customer.id, "assistant", reply);
        await sendFacebookMessage(senderId, reply);
      } catch (err) {
        console.error("Facebook webhook error:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
