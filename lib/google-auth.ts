import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { GOOGLE_CLIENT_ID } from "./site";

/* ------------------------------------------------------------------ */
/* "Continue with Google" — verifies the ID token from Google Identity */
/* Services (signature, issuer, audience, expiry) using Google's       */
/* public keys. No Google SDK or secret needed.                        */
/* ------------------------------------------------------------------ */

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleProfile = { name: string; email: string };

/** Returns the verified name + email, or null if the token isn't valid. */
export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile | null> {
  if (!GOOGLE_CLIENT_ID) return null;
  try {
    const { payload } = await jwtVerify(credential, googleKeys, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: GOOGLE_CLIENT_ID,
    });
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!email || payload.email_verified !== true) return null;
    const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0];
    return { name: name.slice(0, 100), email };
  } catch (error) {
    console.warn("[google-auth] token rejected:", error instanceof Error ? error.message : error);
    return null;
  }
}
