import { saveBrandKit, type BrandKit } from "@/lib/creative/store";

export const runtime = "nodejs";
export const maxDuration = 30;

/** POST /api/creative/brandkit — enregistre l'identité visuelle. */
export async function POST(req: Request) {
  try {
    const patch = (await req.json()) as Partial<BrandKit>;
    // garde-fous légers : palette = liste de hex, logo = data URL courte
    if (patch.palette && !Array.isArray(patch.palette)) delete patch.palette;
    if (patch.logoDataUrl && typeof patch.logoDataUrl === "string" && patch.logoDataUrl.length > 1_500_000)
      return Response.json({ error: "Logo trop lourd (max ~1 Mo)." }, { status: 413 });
    const brandKit = await saveBrandKit(patch);
    return Response.json({ success: true, brandKit });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
