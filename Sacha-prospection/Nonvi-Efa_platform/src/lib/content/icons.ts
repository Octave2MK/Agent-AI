/**
 * Icônes ligne (lucide-static) récupérées par nom + cache disque.
 * Servent aux schémas/illustrations des carrousels éducatifs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "@/lib/paths";

const CACHE_DIR = path.join(PATHS.creatives, "icons-cache");

// alias FR/concepts → nom lucide
const ALIAS: Record<string, string> = {
  note: "sticky-note", notes: "sticky-note", idee: "lightbulb", idée: "lightbulb", idea: "lightbulb",
  temps: "clock", horloge: "clock", rapide: "zap", eclair: "zap", automatisation: "workflow", workflow: "workflow",
  cerveau: "brain", brain: "brain", lien: "link", liens: "link", recherche: "search", loupe: "search",
  document: "file-text", fichier: "file-text", dossier: "folder", tag: "tag", tags: "tags",
  argent: "banknote", euro: "banknote", croissance: "trending-up", graph: "bar-chart-3", stats: "bar-chart-3",
  check: "check", valide: "check-circle", erreur: "x-circle", alerte: "alert-triangle", cible: "target",
  fusee: "rocket", rocket: "rocket", robot: "bot", ia: "sparkles", magie: "sparkles", email: "mail",
  message: "message-circle", calendrier: "calendar", utilisateur: "user", equipe: "users", client: "user-round",
  base: "database", donnees: "database", cloud: "cloud", parametres: "settings", engrenage: "settings",
  fleche: "arrow-right", coeur: "heart", oeil: "eye", cadenas: "lock", livre: "book-open", stylo: "pen-line",
};

function slug(name: string): string {
  const k = name.toLowerCase().trim();
  return ALIAS[k] ?? k.replace(/[^a-z0-9-]/g, "-");
}

const mem = new Map<string, string>();

export async function getIcon(name: string): Promise<string> {
  const s = slug(name);
  if (mem.has(s)) return mem.get(s)!;
  const cacheFile = path.join(CACHE_DIR, `${s}.svg`);
  try { const c = await fs.readFile(cacheFile, "utf-8"); mem.set(s, c); return c; } catch { /* */ }
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/${s}.svg`);
    if (res.ok) {
      let svg = await res.text();
      if (svg.includes("<svg")) {
        await fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {});
        await fs.writeFile(cacheFile, svg).catch(() => {});
        mem.set(s, svg);
        return svg;
      }
    }
  } catch { /* */ }
  // fallback : petit cercle
  const fb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>`;
  mem.set(s, fb);
  return fb;
}

export async function getIcons(names: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all([...new Set(names.filter(Boolean))].map(async (n) => { out[n] = await getIcon(n); }));
  return out;
}
