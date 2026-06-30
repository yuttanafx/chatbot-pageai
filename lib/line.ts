const LINE_API = "https://api.line.me/v2/bot/message/push";

export async function sendLineMessage(toUserId: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("ยังไม่ได้ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN");

  // LINE จำกัดความยาวข้อความ ตัดเป็นช่วงละ ~4900 ตัวอักษร และส่งได้สูงสุด 5 ข้อความต่อ push
  const chunks = (text.match(/[\s\S]{1,4900}/g) ?? [text]).slice(0, 5);

  const res = await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: toUserId,
      messages: chunks.map((c) => ({ type: "text", text: c })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("LINE send error:", err);
  }
}
