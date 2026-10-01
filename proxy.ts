import { NextResponse, type NextRequest } from "next/server";
import { codeIsValid, TEST_COOKIE } from "@/lib/access";
import { readEnv } from "@/lib/env";

/*
 * Testbetrieb: ein gültiger Testcode in der Adresse (?test=…) bleibt als Cookie erhalten,
 * damit Serverrouten und spätere Aufrufe ohne Code auskommen. Die Zugangsprüfung selbst
 * macht die Seite /booking; ohne Code zeigt sie die Zwischenlösung.
 */
export function proxy(req: NextRequest) {
  if (!readEnv().testMode) return NextResponse.next();
  const fromQuery = req.nextUrl.searchParams.get("test");
  if (!fromQuery || !codeIsValid(fromQuery)) return NextResponse.next();
  const res = NextResponse.next();
  res.cookies.set(TEST_COOKIE, fromQuery, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export const config = {
  matcher: ["/booking"],
};
