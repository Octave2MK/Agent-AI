/**
 * Récupère les VRAIS logos par nom. Sources en cascade (fiabilité max) :
 *  1) gilbarbara/logos (GitHub, ~2000 logos COULEUR, dont Salesforce) via jsDelivr
 *  2) simple-icons (SVG monochrome recolorable)
 *  3) Clearbit / favicon Google (raster)
 *  4) pastille initiale
 * Cache disque.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { PATHS } from "@/lib/paths";

const CACHE_DIR = path.join(PATHS.creatives, "logos-cache");

// slugs simple-icons (source 2)
const SI: Record<string, string> = {
  "google maps": "googlemaps", chatgpt: "openai", gpt: "openai", openai: "openai",
  claude: "claude", anthropic: "claude", x: "x", twitter: "x", notion: "notion",
  obsidian: "obsidian", n8n: "n8n", make: "make", zapier: "zapier", airtable: "airtable",
  slack: "slack", gmail: "gmail", figma: "figma", canva: "canva", linkedin: "linkedin",
  shopify: "shopify", stripe: "stripe", hubspot: "hubspot", perplexity: "perplexity",
};
// candidats de nom gilbarbara (source 1) — plusieurs variantes essayées
const GB: Record<string, string[]> = {
  salesforce: ["salesforce"], hubspot: ["hubspot"], notion: ["notion"], obsidian: ["obsidian"],
  claude: ["claude", "claude-ai", "anthropic"], anthropic: ["anthropic"], chatgpt: ["openai", "openai-icon"],
  openai: ["openai", "openai-icon"], "google maps": ["google-maps", "google-maps-icon"],
  n8n: ["n8n"], make: ["make-icon", "integromat"], zapier: ["zapier", "zapier-icon"],
  airtable: ["airtable"], slack: ["slack", "slack-icon"], gmail: ["gmail", "google-gmail"],
  figma: ["figma"], canva: ["canva", "canva-icon"], notionso: ["notion"], monday: ["monday", "monday-icon"],
  asana: ["asana", "asana-icon"], trello: ["trello"], clickup: ["clickup", "clickup-icon"],
  pipedrive: ["pipedrive"], intercom: ["intercom", "intercom-icon"], zendesk: ["zendesk", "zendesk-icon"],
  mailchimp: ["mailchimp", "mailchimp-icon"], webflow: ["webflow", "webflow-icon"], framer: ["framer"],
  stripe: ["stripe", "stripe-icon"], shopify: ["shopify"], hubspotcrm: ["hubspot"], linear: ["linear-icon", "linear"],
  vercel: ["vercel", "vercel-icon"], perplexity: ["perplexity", "perplexity-icon"], gemini: ["google-gemini"],
  midjourney: ["midjourney"], discord: ["discord", "discord-icon"], youtube: ["youtube-icon", "youtube"],
  instagram: ["instagram-icon", "instagram"], tiktok: ["tiktok-icon", "tiktok"],
};
const DOMAIN: Record<string, string> = {
  salesforce: "salesforce.com", hubspot: "hubspot.com", notion: "notion.so", obsidian: "obsidian.md",
  claude: "claude.ai", anthropic: "anthropic.com", openai: "openai.com", chatgpt: "openai.com",
  n8n: "n8n.io", make: "make.com", zapier: "zapier.com", airtable: "airtable.com", slack: "slack.com",
  gmail: "google.com", figma: "figma.com", canva: "canva.com", shopify: "shopify.com", stripe: "stripe.com",
  monday: "monday.com", asana: "asana.com", pipedrive: "pipedrive.com", intercom: "intercom.com",
};

const norm = (s: string) => s.toLowerCase().trim();
const bare = (s: string) => norm(s).replace(/[^a-z0-9]/g, "");

export type LogoKind = "svgcolor" | "svg" | "img" | "initial";
export interface Logo { name: string; kind: LogoKind; svg?: string; imgDataUrl?: string; hex: string }

async function rc(k: string): Promise<string | null> { try { return await fs.readFile(path.join(CACHE_DIR, k), "utf-8"); } catch { return null; } }
async function wc(k: string, v: string): Promise<void> { try { await fs.mkdir(CACHE_DIR, { recursive: true }); await fs.writeFile(path.join(CACHE_DIR, k), v); } catch { /* */ } }

async function fetchText(url: string): Promise<string | null> {
  try { const r = await fetch(url); if (!r.ok) return null; const t = await r.text(); return t.includes("<svg") ? t : null; } catch { return null; }
}
async function fetchDataUrl(url: string): Promise<string | null> {
  try { const r = await fetch(url, { redirect: "follow" }); if (!r.ok) return null; const ct = r.headers.get("content-type") || "image/png"; if (!/image\//.test(ct)) return null; const b = Buffer.from(await r.arrayBuffer()); return b.length < 200 ? null : `data:${ct};base64,${b.toString("base64")}`; } catch { return null; }
}

const HEX = ["#E24A1B", "#5B4DEE", "#1F8A6D", "#C0453A", "#3A5B9E", "#D98B3A"];
const hashHex = (n: string) => { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0; return HEX[h % HEX.length]; };

export async function getLogo(name: string): Promise<Logo> {
  const key = bare(name);
  // 1) gilbarbara/logos (couleur) — source GitHub
  let color = await rc(`${key}.color.svg`);
  if (!color) {
    const cands = GB[norm(name)] ?? [key];
    for (const c of cands) {
      const svg = await fetchText(`https://cdn.jsdelivr.net/gh/gilbarbara/logos/logos/${c}.svg`);
      if (svg) { color = svg; await wc(`${key}.color.svg`, svg); break; }
    }
  }
  if (color) return { name, kind: "svgcolor", svg: color, hex: "#ffffff" };
  // 2) simple-icons (monochrome)
  let mono = await rc(`${key}.mono.svg`);
  if (!mono) { const svg = await fetchText(`https://cdn.simpleicons.org/${SI[norm(name)] ?? key}`); if (svg) { mono = svg; await wc(`${key}.mono.svg`, svg); } }
  if (mono) { const hex = mono.match(/fill="(#[0-9a-fA-F]{3,6})"/)?.[1] ?? "#333"; return { name, kind: "svg", svg: mono, hex }; }
  // 3) raster
  const dom = DOMAIN[norm(name)] ?? `${key}.com`;
  let img = await rc(`${key}.img`);
  if (!img) { img = (await fetchDataUrl(`https://logo.clearbit.com/${dom}?size=128`)) ?? (await fetchDataUrl(`https://www.google.com/s2/favicons?domain=${dom}&sz=128`)); if (img) await wc(`${key}.img`, img); }
  if (img) return { name, kind: "img", imgDataUrl: img, hex: "#fff" };
  // 4) initiale
  return { name, kind: "initial", hex: hashHex(name) };
}

export async function getLogos(names: string[]): Promise<Logo[]> {
  const out: Logo[] = [];
  for (const n of names.map((x) => x.trim()).filter(Boolean)) out.push(await getLogo(n));
  return out;
}
