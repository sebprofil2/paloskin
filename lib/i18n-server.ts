import { cookies, headers } from "next/headers";
import { isLang, LANG_COOKIE, LANG_HEADER, pickLang, type Lang } from "./i18n";

/* Sprache der laufenden Anfrage auf dem Server: vom Proxy erkannt (proxy.ts), sonst hier nach derselben Regel */
export async function requestLang(): Promise<Lang> {
  const h = await headers();
  const fromProxy = h.get(LANG_HEADER);
  if (isLang(fromProxy)) return fromProxy;
  return pickLang({ cookie: (await cookies()).get(LANG_COOKIE)?.value, acceptLanguage: h.get("accept-language") });
}
