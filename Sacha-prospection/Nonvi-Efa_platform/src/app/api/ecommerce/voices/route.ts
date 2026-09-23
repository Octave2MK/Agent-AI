import { isArcadsMcpConnected, bearerListVoices } from "@/lib/integrations/arcadsMcp";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/ecommerce/voices
 * → { voices: [{ id, name, audioUrl? }] } — voix nommées du workspace Arcads
 *   (dont les clones français type Guillaume / Roland), pour la génération avatar.
 */
export async function GET() {
  if (!(await isArcadsMcpConnected())) {
    return Response.json(
      { error: "Arcads non connecté.", needsConfig: true, authUrl: "/api/integrations/arcads/start" },
      { status: 412 }
    );
  }
  try {
    const voices = await bearerListVoices();
    return Response.json({ voices });
  } catch (err) {
    console.error("[ecommerce/voices]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
