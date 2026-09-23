import { getPost, updatePost } from "@/lib/content/store";
import { createSlideJobs, pollSlideJobs } from "@/lib/content/visual";
import { composeType1 } from "@/lib/content/hybrid";
import { isHiggsfieldConfigured } from "@/lib/integrations/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/content/visuals { id }
 * Type 1 → rendu HYBRIDE (fond IA + overlay exact). Sinon → 1 job Higgsfield par slide.
 */
export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    if (!isHiggsfieldConfigured()) return Response.json({ error: "Higgsfield non connecté (higgsfield auth login)." }, { status: 412 });
    const post = await getPost(id);
    if (!post) return Response.json({ error: "Post introuvable" }, { status: 404 });

    // Type 1 : rendu hybride (déterministe, logos/texte exacts)
    if (post.t1?.slides?.length) {
      const images = await composeType1(id, post.t1, post.refId);
      await updatePost(id, { visuals: { jobs: [], images, done: true } });
      return Response.json({ success: true, count: images.length, hybrid: true });
    }
    const slides = post.result.slides ?? (post.result.headline ? [{ title: post.result.headline, body: "" }] : []);
    if (!slides.length) return Response.json({ error: "Ce post n'a pas de slides à visualiser." }, { status: 400 });
    if (!post.refId) return Response.json({ error: "Aucun template de référence sélectionné." }, { status: 400 });

    const jobs = await createSlideJobs(post.platform, slides, post.refId, post.idea);
    await updatePost(id, { visuals: { jobs, images: new Array(slides.length).fill(null), done: false } });
    return Response.json({ success: true, count: jobs.length });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

/** GET /api/content/visuals?id=... — poll l'état des jobs, met à jour les images. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id requis" }, { status: 400 });
  const post = await getPost(id);
  if (!post?.visuals) return Response.json({ error: "Aucune génération en cours." }, { status: 404 });
  // hybride Type 1 (pas de jobs, images déjà rendues)
  if (!post.visuals.jobs?.length) return Response.json({ images: post.visuals.images, done: post.visuals.done });
  try {
    const results = await pollSlideJobs(post.visuals.jobs);
    const images = [...post.visuals.images];
    for (const r of results) if (r.status === "completed" && r.imageUrl) images[r.index] = r.imageUrl;
    const done = images.every((x) => x) || results.every((r) => r.status === "completed" || r.status === "failed");
    await updatePost(id, { visuals: { ...post.visuals, images, done } });
    return Response.json({ images, done, statuses: results.map((r) => r.status) });
  } catch (err) {
    return Response.json({ images: post.visuals.images, done: false, note: err instanceof Error ? err.message : "poll" });
  }
}
