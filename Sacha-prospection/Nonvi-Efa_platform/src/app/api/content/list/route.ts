import { listPosts } from "@/lib/content/store";

export const runtime = "nodejs";

/** GET /api/content/list → tous les posts enregistrés (bibliothèque + reprise session). */
export async function GET() {
  return Response.json({ posts: await listPosts() });
}
