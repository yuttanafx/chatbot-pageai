import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า ADMIN_PASSWORD" },
      { status: 500 }
    );
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  setAuthCookie(password);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
