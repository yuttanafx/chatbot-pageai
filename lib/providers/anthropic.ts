import type { ChatMsg } from "./types";

export async function callAnthropic(apiKey: string, systemPrompt: string, history: ChatMsg[], temperature = 0.6): Promise<string> {
  if (!apiKey) throw new Error("ยังไม่ได้ตั้งค่า Anthropic API Key ในหน้า Admin > ตั้งค่า");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      temperature,
      system: systemPrompt,
      messages: history,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: any) => b.type === "text");
  return textBlock?.text ?? "";
}
