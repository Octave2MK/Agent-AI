import { NextResponse } from "next/server";
import { handleArcadsCallback } from "@/lib/integrations/arcadsMcp";

export const runtime = "nodejs";

/**
 * GET /api/integrations/arcads/callback?code=…&state=…
 * Échange le code OAuth contre les tokens puis renvoie vers le Studio d'Emma.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(
      new URL(`/agents/ecommerce?arcads=refused`, url.origin)
    );
  }
  if (!code || !state) {
    return NextResponse.json({ error: "code/state manquants" }, { status: 400 });
  }
  try {
    await handleArcadsCallback(code, state);
    return NextResponse.redirect(new URL(`/agents/ecommerce?arcads=connected`, url.origin));
  } catch (e) {
    console.error("[arcads/callback]", e);
    return NextResponse.redirect(new URL(`/agents/ecommerce?arcads=error`, url.origin));
  }
}
