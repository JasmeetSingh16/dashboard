import { GOOGLE_RETURN_COOKIE } from "@/lib/lead-gate";

/*
 * POST /api/google-return/ — Google's "Continue with Google" redirect target
 * (Google Identity Services, ux_mode "redirect"). Google posts the signed-in
 * visitor's ID token here as a form field; we send them back to the agent page
 * they came from (saved in a cookie by ReportGate) with the token in the URL
 * fragment. The page then unlocks the report through /api/agent-leads/, which
 * verifies the token. Nothing is saved here.
 *
 * Register this URL under "Authorised redirect URIs" in Google Cloud:
 *   https://ai.jaseir.com/api/google-return/   (and http://localhost:3301/api/google-return/ for local tests)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cookie(request: Request, name: string): string | null {
  const match = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/** Only send people back to a page on this site (or localhost while testing). */
function safeReturnUrl(request: Request, raw: string | null): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0];
    const local = process.env.NODE_ENV !== "production" && url.hostname === "localhost";
    if (!/^https?:$/.test(url.protocol) || (url.hostname !== host && !local)) return null;
    return url;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const credential = form?.get("credential");
  const back = safeReturnUrl(request, cookie(request, GOOGLE_RETURN_COOKIE));
  const fallback = new URL("/", request.url);

  if (!back) return Response.redirect(fallback, 303);
  back.hash = typeof credential === "string" && credential ? `google-credential=${credential}` : "google-cancelled";
  return Response.redirect(back, 303);
}
