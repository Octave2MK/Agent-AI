import { arcadsConfigured, listActors, showcaseTemplates } from "@/lib/integrations/arcads";
import { isArcadsMcpConnected, mcpListSituations } from "@/lib/integrations/arcadsMcp";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/ecommerce/actors?gender=Female&age=Adult   → { actors }
 * GET /api/ecommerce/actors?templates=showcase        → { templates }
 *
 * En mode MCP, l'« id » d'un acteur est directement le situationId
 * (acteur + décor), utilisable tel quel pour la génération.
 */
export async function GET(req: Request) {
  const mcp = await isArcadsMcpConnected();
  if (!mcp && !arcadsConfigured()) {
    return Response.json(
      { error: "Arcads non connecté.", needsConfig: true, authUrl: "/api/integrations/arcads/start" },
      { status: 412 }
    );
  }
  const url = new URL(req.url);
  try {
    const templatesKind = url.searchParams.get("templates"); // "showcase" | "unboxing"
    if (templatesKind) {
      if (mcp) {
        const items = await mcpListSituations({
          contentType: templatesKind === "unboxing" ? "unboxing_pov" : "product_showcase",
        });
        return Response.json({
          templates: items.map((s) => ({
            id: s.id,
            imageUrl: s.imageUrl ?? s.actor?.imageUrl,
            previewUrl: s.previewUrl,
            tags: s.tags,
          })),
        });
      }
      const templates = await showcaseTemplates();
      return Response.json({ templates });
    }

    const gender = url.searchParams.get("gender") ?? undefined; // "Female" | "Male"
    const age = url.searchParams.get("age") ?? undefined; // "Young Adult" | "Adult" | "Senior"

    if (mcp) {
      const items = await mcpListSituations({
        contentType: "talking_actor",
        actorGender: gender ? (gender.toLowerCase() as "male" | "female") : undefined,
        actorAge: age ? (age.toLowerCase() as "adult" | "senior" | "young adult") : undefined,
      });
      return Response.json({
        actors: items.map((s) => ({
          id: s.id, // situationId — directement utilisable pour générer
          name: s.actor?.name ?? "Acteur",
          gender: s.actor?.gender ?? "",
          age: s.actor?.age ?? "",
          imageUrl: s.imageUrl ?? s.actor?.imageUrl ?? s.previewUrl ?? "",
        })),
      });
    }

    const actors = await listActors({ gender, age });
    return Response.json({ actors });
  } catch (err) {
    console.error("[ecommerce/actors]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
