import { NextRequest, NextResponse } from "next/server";
import { createShop, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password, shop_name } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอก username และ password" }, { status: 400 });
  }
  if (username.length < 3) {
    return NextResponse.json({ error: "Username ต้องมีอย่างน้อย 3 ตัวอักษร" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  }

  try {
    const shopId = await createShop(username, password, shop_name);
    setAuthCookie(shopId, username);
    return NextResponse.json({ ok: true, shopId });
  } catch (err: any) {
    const raw = String(err.message ?? "");
    const msg = raw.includes("duplicate") || raw.includes("unique")
      ? "Username นี้มีร้านอื่นใช้ไปแล้ว กรุณาเลือกชื่ออื่น"
      : raw || "สมัครไม่สำเร็จ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
