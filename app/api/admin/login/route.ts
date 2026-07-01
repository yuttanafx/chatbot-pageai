import { NextRequest, NextResponse } from "next/server";
import { verifyLogin, setupFirstAdmin, setAuthCookie, clearAuthCookie } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอก username และ password" }, { status: 400 });
  }

  try {
    const settings = await getSettings();

    // ครั้งแรก (setup) — ตั้งรหัสผ่านใหม่เลย
    if (!settings.is_setup_done) {
      await setupFirstAdmin(username, password);
      setAuthCookie(username);
      return NextResponse.json({ ok: true, firstSetup: true });
    }

    const valid = await verifyLogin(username, password);
    if (!valid) {
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }

    setAuthCookie(username);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
