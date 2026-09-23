import { readPhoto } from "@/lib/ecommerce/store";

export const runtime = "nodejs";

/** GET /api/ecommerce/photo/{name} — sert les photos produit stockées en local. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const buf = await readPhoto(name);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop()?.toLowerCase() ?? "png";
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": mime, "Cache-Control": "public, max-age=86400" },
  });
}
