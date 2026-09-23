import { getDeliverable } from "@/lib/deliverables";
import type { AgentSlug } from "@/lib/types";

export const runtime = "nodejs";

const VALID: AgentSlug[] = ["strategiste", "createur-contenu", "designer", "presentateur", "analyste", "gmail", "fireflies", "cv"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const agent = url.searchParams.get("agent");
  const slug = url.searchParams.get("slug");

  if (!agent || !slug) {
    return Response.json({ error: "Missing agent or slug" }, { status: 400 });
  }
  if (!VALID.includes(agent as AgentSlug)) {
    return Response.json({ error: "Invalid agent" }, { status: 400 });
  }
  // Sécurité : empêche path traversal
  if (slug.includes("/") || slug.includes("..") || slug.includes("\\")) {
    return Response.json({ error: "Invalid slug" }, { status: 400 });
  }

  const result = await getDeliverable(agent as AgentSlug, slug);
  if (!result) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    deliverable: result.deliverable,
    content: result.content,
  });
}
