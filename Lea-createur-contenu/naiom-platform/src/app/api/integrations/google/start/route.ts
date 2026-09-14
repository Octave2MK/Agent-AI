import { NextResponse } from "next/server";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/integrations/google";

export const runtime = "nodejs";

/**
 * GET /api/integrations/google/start
 * Redirige vers l'écran de consentement Google (scopes YouTube + Gmail).
 */
export async function GET() {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_CLIENT_ID / CLIENT_SECRET / REDIRECT_URI manquants dans .env.local",
      },
      { status: 412 }
    );
  }

  const authUrl = buildAuthUrl();
  return NextResponse.redirect(authUrl);
}
