import fs from "node:fs/promises";
import path from "node:path";
import { ownedSlug } from "@/lib/agents";
import { keysFor } from "@/lib/setup/requiredKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENV_PATH = path.join(process.cwd(), ".env.local");

/** GET /api/setup?slug= → clés attendues pour l'agent + lesquelles sont déjà remplies. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug") || ownedSlug();
  const specs = keysFor(slug);
  const keys = specs.map((k) => ({ ...k, set: !!process.env[k.name]?.trim() }));
  const missingRequired = keys.some((k) => k.required && !k.set);
  return Response.json({ slug, keys, missingRequired });
}

/** POST /api/setup { values: { NAME: value } } → écrit dans .env.local (upsert). */
export async function POST(req: Request) {
  try {
    const { values, slug } = (await req.json()) as { values?: Record<string, string>; slug?: string };
    if (!values || typeof values !== "object") return Response.json({ error: "values requis" }, { status: 400 });
    const allowed = new Set(keysFor(slug ?? ownedSlug()).map((k) => k.name));

    let content = "";
    try { content = await fs.readFile(ENV_PATH, "utf-8"); } catch { /* nouveau fichier */ }
    const lines = content.split("\n");

    for (const [name, raw] of Object.entries(values)) {
      if (!allowed.has(name)) continue; // sécurité : seules les clés attendues
      const val = String(raw ?? "").trim();
      if (!val) continue;
      const line = `${name}=${val}`;
      const idx = lines.findIndex((l) => l.replace(/^#\s*/, "").startsWith(`${name}=`));
      if (idx >= 0) lines[idx] = line;
      else lines.push(line);
    }
    await fs.writeFile(ENV_PATH, lines.join("\n").replace(/\n{3,}/g, "\n\n"), "utf-8");
    // Next (dev) recharge automatiquement .env.local → les clés seront dispo après reload.
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
