import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

export function isAuthed(): boolean {
  const c = cookies().get(COOKIE_NAME);
  return c?.value === process.env.ADMIN_PASSWORD;
}

export function setAuthCookie(password: string) {
  cookies().set(COOKIE_NAME, password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  });
}

export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

export { COOKIE_NAME };
