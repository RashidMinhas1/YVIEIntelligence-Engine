import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthLoginBody } from "@/lib/validators";
import { AUTH_COOKIE } from "@/lib/auth-cookie";

export async function POST(request: NextRequest) {
  const parsed = AuthLoginBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const expected = process.env.PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Server auth not configured" }, { status: 500 });
  }

  if (parsed.data.password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return NextResponse.json({ ok: true });
}
