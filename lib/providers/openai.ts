import type { ChatMsg } from "./types";

export async function callOpenAI(apiKey: string, systemPrompt: string, history: ChatMsg[], temperature = 0.6): Promise<string> {
  if (!apiKey) throw new Error("ยังไม่ได้ตั้งค่า OpenAI API Key ในหน้า Admin > ตั้งค่า");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600,
      temperature,
      messages: [{ role: "system", content: systemPrompt }, ...history],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
