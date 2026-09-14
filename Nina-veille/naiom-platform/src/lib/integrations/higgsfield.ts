/**
 * Intégration Higgsfield pour l'agent Creative Strategist (Mia).
 * Pilote le **CLI Higgsfield** (authentifié en OAuth : `higgsfield auth login`),
 * pas une paire de clés REST. Le CLI stocke ses creds dans ~/.config/higgsfield/.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pexec = promisify(execFile);
const HOME = os.homedir();
const CONFIG_DIR = path.join(HOME, ".config", "higgsfield");

/** Résout le binaire higgsfield (symlink installé par `npm i -g`). */
function bin(): string {
  const candidates = [
    path.join(HOME, ".local", "bin", "higgsfield"),
    "/usr/local/bin/higgsfield",
    "/opt/homebrew/bin/higgsfield",
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return "higgsfield"; // fallback PATH
}

export function isHiggsfieldConfigured(): boolean {
  try {
    const creds = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, "credentials.json"), "utf-8"));
    const cfg = JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, "config.json"), "utf-8"));
    return Boolean(creds?.access_token && cfg?.workspace_id);
  } catch {
    return false;
  }
}

async function hf(args: string[], timeoutMs = 60_000): Promise<unknown> {
  const { stdout } = await pexec(bin(), [...args, "--json"], {
    timeout: timeoutMs,
    maxBuffer: 8 * 1024 * 1024,
    env: { ...process.env, HOME, PATH: `${path.join(HOME, ".local", "bin")}:${process.env.PATH ?? ""}` },
  });
  const txt = stdout.trim();
  try { return JSON.parse(txt); } catch { return txt; }
}

/** Formats UI → aspect_ratio Soul. */
export const SOUL_ASPECT: Record<string, string> = {
  "1:1": "1:1", "9:16": "9:16", "16:9": "16:9", "4:5": "3:4",
};

export interface SoulParams {
  prompt: string;
  format?: string;
  quality?: "1.5k" | "2k";
  negativePrompt?: string; // non natif Soul → intégré au prompt
  seed?: number;
}

export interface SoulJob { requestId: string; statusUrl: null }

/** Lance une génération Soul via le CLI. Renvoie l'id du job. */
export async function generateSoul(p: SoulParams): Promise<SoulJob> {
  const prompt = p.negativePrompt
    ? `${p.prompt}\n\n(avoid: ${p.negativePrompt}. No text, no letters, no watermark.)`
    : p.prompt;
  const args = [
    "generate", "create", "text2image_soul_v2",
    "--prompt", prompt,
    "--aspect_ratio", SOUL_ASPECT[p.format ?? "1:1"] ?? "1:1",
    "--quality", p.quality ?? "2k",
  ];
  if (typeof p.seed === "number") args.push("--seed", String(p.seed));
  const out = await hf(args, 60_000);
  const ids = Array.isArray(out) ? out : (out as { ids?: string[] })?.ids;
  const id = Array.isArray(ids) ? ids[0] : typeof out === "string" ? out.trim() : undefined;
  if (!id) throw new Error("Higgsfield : aucun id de job renvoyé par le CLI.");
  return { requestId: String(id), statusUrl: null };
}

export interface SoulResult {
  status: "queued" | "in_progress" | "completed" | "failed" | "unknown";
  imageUrl: string | null;
  thumbUrl: string | null;
}

/* ============ Générique (tout modèle image, ex. nano_banana_pro) ============ */
export interface HfJobResult {
  status: "queued" | "in_progress" | "completed" | "failed" | "unknown";
  imageUrl: string | null;
}

/** Crée un job image générique. imageRefs = chemins locaux (auto-uploadés) ou ids. */
export async function hfCreate(
  jobType: string,
  prompt: string,
  imageRefs: string[] = [],
  params: Record<string, string> = {}
): Promise<string> {
  const args = ["generate", "create", jobType, "--prompt", prompt];
  for (const [k, v] of Object.entries(params)) args.push(`--${k}`, v);
  for (const ref of imageRefs) args.push("--image-references", ref);
  const out = await hf(args, 120_000);
  const ids = Array.isArray(out) ? out : (out as { ids?: string[] })?.ids;
  const id = Array.isArray(ids) ? ids[0] : typeof out === "string" ? out.trim() : undefined;
  if (!id) throw new Error("Higgsfield : aucun id de job renvoyé (create).");
  return String(id);
}

/** Interroge un job image générique. */
export async function hfGet(id: string): Promise<HfJobResult> {
  const d = (await hf(["generate", "get", id], 30_000)) as Record<string, unknown>;
  const raw = String(d.status ?? "").toLowerCase();
  const status: HfJobResult["status"] =
    raw === "completed" || raw === "succeeded" ? "completed"
    : raw.includes("fail") || raw.includes("error") || raw === "canceled" ? "failed"
    : raw.includes("progress") || raw.includes("run") ? "in_progress"
    : raw.includes("queue") || raw.includes("pending") || raw === "nsfw" ? "queued"
    : "unknown";
  return { status, imageUrl: typeof d.result_url === "string" ? d.result_url : null };
}

/** Interroge l'état d'un job Soul via le CLI. */
export async function pollSoul(job: { requestId?: string }): Promise<SoulResult> {
  if (!job.requestId) throw new Error("Aucun id de job Higgsfield.");
  const d = (await hf(["generate", "get", job.requestId], 30_000)) as Record<string, unknown>;
  const raw = String(d.status ?? "").toLowerCase();
  const status: SoulResult["status"] =
    raw === "completed" || raw === "succeeded" ? "completed"
    : raw.includes("fail") || raw.includes("error") || raw === "canceled" ? "failed"
    : raw.includes("progress") || raw.includes("run") ? "in_progress"
    : raw.includes("queue") || raw.includes("pending") || raw === "nsfw" ? "queued"
    : "unknown";
  return {
    status,
    imageUrl: typeof d.result_url === "string" ? d.result_url : null,
    thumbUrl: typeof d.min_result_url === "string" ? d.min_result_url : (typeof d.result_url === "string" ? d.result_url : null),
  };
}
