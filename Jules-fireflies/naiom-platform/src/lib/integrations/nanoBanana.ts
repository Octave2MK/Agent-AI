import fs from "node:fs/promises";
import path from "node:path";

/**
 * Connecteur Nano Banana (Gemini 2.5 Flash Image) — natif REST.
 *
 * Variable d'env requise : GEMINI_API_KEY (console.cloud.google.com → Gemini API ou aistudio.google.com)
 *
 * Doc API : https://ai.google.dev/gemini-api/docs/image-generation
 * Model ID : gemini-2.5-flash-image
 */

const MODEL_ID = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`;

export const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public", "generated-images");
export const PUBLIC_IMAGES_URL = "/generated-images";

export function isNanoBananaConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

interface GenerateResult {
  filename: string;
  publicUrl: string;
  absPath: string;
  bytes: number;
}

/** Image de référence fournie en entrée (mode image→image / fusion). */
export interface ReferenceImage {
  /** Données brutes encodées en base64 (sans le préfixe data:). */
  data: string;
  /** Type MIME, ex. "image/jpeg", "image/png". */
  mimeType: string;
}

function slugifyName(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image"
  );
}

/**
 * Génère une image à partir d'un prompt texte, et — optionnellement — d'une ou
 * plusieurs images de référence (mode image→image / fusion : visage, produit,
 * style à conserver). Nano Banana excelle pour composer un sujet réel dans une
 * scène générée tout en gardant la cohérence du personnage.
 *
 * Sauvegarde le PNG dans public/generated-images/ et retourne l'URL publique.
 */
export async function generateImage(
  prompt: string,
  opts?: { slug?: string; references?: ReferenceImage[] }
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY manquante dans .env.local. Créez une clé sur aistudio.google.com puis redémarrez le dev server."
    );
  }

  // Les images de référence DOIVENT précéder le texte : le modèle les traite
  // comme le sujet à composer, puis le prompt comme l'instruction de mise en scène.
  const refParts = (opts?.references ?? []).map((r) => ({
    inlineData: { mimeType: r.mimeType, data: r.data },
  }));

  const body = {
    contents: [
      {
        role: "user",
        parts: [...refParts, { text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      throw new Error(
        "Quota Gemini épuisé pour la génération d'IMAGES (limite 0). Le tier GRATUIT de Gemini n'inclut PAS " +
          "Nano Banana / la génération d'images : il faut un projet Google avec FACTURATION activée. " +
          "→ aistudio.google.com → « Get API key » sur un projet Cloud où le Billing est actif, puis remplacez " +
          "GEMINI_API_KEY dans .env.local et redémarrez."
      );
    }
    if (res.status === 400 && /API key not valid/i.test(errText)) {
      throw new Error("GEMINI_API_KEY invalide. Vérifiez la clé dans .env.local.");
    }
    throw new Error(`Gemini API ${res.status} : ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p?.inlineData?.data);

  if (!imagePart?.inlineData?.data) {
    const textReply = parts.find((p: { text?: string }) => p?.text)?.text;
    throw new Error(
      `Aucune image retournée par Gemini. ${textReply ? `Réponse texte : ${textReply.slice(0, 200)}` : ""}`
    );
  }

  const base64 = imagePart.inlineData.data as string;
  const mime = (imagePart.inlineData.mimeType as string) || "image/png";
  const ext = mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png";
  const buf = Buffer.from(base64, "base64");

  const timestamp = Date.now();
  const slugBase = opts?.slug || slugifyName(prompt.slice(0, 60));
  const filename = `${new Date().toISOString().slice(0, 10)}-${slugBase}-${timestamp}.${ext}`;
  const absPath = path.join(PUBLIC_IMAGES_DIR, filename);

  await fs.mkdir(PUBLIC_IMAGES_DIR, { recursive: true });
  await fs.writeFile(absPath, buf);

  return {
    filename,
    publicUrl: `${PUBLIC_IMAGES_URL}/${filename}`,
    absPath,
    bytes: buf.length,
  };
}
