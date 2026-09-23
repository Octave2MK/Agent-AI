import fs from "node:fs/promises";
import path from "node:path";
import type { ReferenceImage } from "../integrations/nanoBanana";

/**
 * Accès au dossier MINIATURE — la banque de photos de référence (le visage de
 * Melyssa) utilisée pour incruster un vrai visage dans les miniatures YouTube.
 *
 * Le dossier vit à la RACINE du projet (../MINIATURE par rapport au cwd Next,
 * qui est `Nonvi-Efa-platform/`). On résout de façon défensive : variable d'env
 * MINIATURE_DIR > `../MINIATURE` > `./MINIATURE` — on prend le premier qui existe.
 */

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Au-delà de cette taille, l'envoi inline à Gemini devient risqué (limite ~20 Mo
// pour l'ensemble de la requête une fois encodé base64 ≈ +33 %).
const MAX_INLINE_BYTES = 15 * 1024 * 1024;

export interface ReferenceFace {
  /** Nom de fichier seul, ex. "DSC00391.JPG". */
  name: string;
  /** Chemin absolu sur disque. */
  absPath: string;
  bytes: number;
  /** Taille lisible, ex. "7.6 Mo". */
  sizeLabel: string;
}

function candidateDirs(): string[] {
  const cwd = process.cwd();
  const fromEnv = process.env.MINIATURE_DIR;
  return [
    ...(fromEnv ? [path.resolve(cwd, fromEnv)] : []),
    path.resolve(cwd, "..", "MINIATURE"),
    path.resolve(cwd, "MINIATURE"),
  ];
}

/** Renvoie le premier dossier MINIATURE existant, ou null. */
export async function resolveMiniatureDir(): Promise<string | null> {
  for (const dir of candidateDirs()) {
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) return dir;
    } catch {
      // dossier absent → on essaie le suivant
    }
  }
  return null;
}

function mimeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} o`;
}

/**
 * Liste les photos de référence disponibles dans MINIATURE, triées de la plus
 * lourde à la plus légère (la photo portrait haute résolution remonte en tête,
 * les petits logos/icônes finissent en bas).
 */
export async function listReferenceFaces(): Promise<ReferenceFace[]> {
  const dir = await resolveMiniatureDir();
  if (!dir) return [];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const faces: ReferenceFace[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (!IMAGE_EXTENSIONS.has(ext.toLowerCase())) continue;

    const absPath = path.join(dir, entry.name);
    const stat = await fs.stat(absPath);
    faces.push({
      name: entry.name,
      absPath,
      bytes: stat.size,
      sizeLabel: humanSize(stat.size),
    });
  }

  return faces.sort((a, b) => b.bytes - a.bytes);
}

/**
 * Choisit la photo de référence : par nom exact si fourni, sinon la plus lourde
 * (= le portrait haute résolution, pas un logo).
 */
export async function pickReferenceFace(name?: string): Promise<ReferenceFace | null> {
  const faces = await listReferenceFaces();
  if (faces.length === 0) return null;
  if (name) {
    const match = faces.find((f) => f.name === name);
    if (match) return match;
  }
  return faces[0];
}

/** Lit une photo de référence et l'encode pour l'envoi inline à Nano Banana. */
export async function readReferenceInline(face: ReferenceFace): Promise<ReferenceImage> {
  if (face.bytes > MAX_INLINE_BYTES) {
    throw new Error(
      `La photo « ${face.name} » fait ${face.sizeLabel} — trop lourde pour l'envoi inline (max 15 Mo). Réduisez-la avant de réessayer.`
    );
  }
  const buf = await fs.readFile(face.absPath);
  return {
    data: buf.toString("base64"),
    mimeType: mimeFromExt(path.extname(face.name)),
  };
}
