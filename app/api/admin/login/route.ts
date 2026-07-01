import { NextRequest, NextResponse } from "next/server";
import { verifyLogin, setAuthCookie, clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "กรุณากรอก username และ password" }, { status: 400 });
  }

  try {
    const result = await verifyLogin(username, password);
    if (!result) {
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }
    setAuthCookie(result.shopId, username);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  clearAuthCookie();
  return NextResponse.json({ ok: true });
}
