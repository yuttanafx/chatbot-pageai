const FB_API = "https://graph.facebook.com/v20.0/me/messages";

export async function sendFacebookMessage(recipientId: string, text: string) {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("ยังไม่ได้ตั้งค่า FACEBOOK_PAGE_ACCESS_TOKEN");

  // Messenger จำกัดความยาวข้อความ ตัดเป็นช่วงละ ~1900 ตัวอักษร
  const chunks = text.match(/[\s\S]{1,1900}/g) ?? [text];

  for (const chunk of chunks) {
    const res = await fetch(`${FB_API}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: chunk },
        messaging_type: "RESPONSE",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Facebook send error:", err);
    }
  }
}
