import fs from "node:fs/promises";
import path from "node:path";
import puppeteer, { type Browser } from "puppeteer";
import { parseDeckMarkdown } from "../presentations/parseMarkdown";
import type { Presentation } from "../presentations/template";
import { renderCarouselSlideHTML, type CarouselRatio } from "./template";

export const PUBLIC_CAROUSELS_DIR = path.join(process.cwd(), "public", "generated-carousels");
export const PUBLIC_CAROUSELS_URL = "/generated-carousels";

const DIMENSIONS: Record<CarouselRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

export interface GeneratedSlide {
  index: number;
  filename: string;
  publicUrl: string;
  absPath: string;
  bytes: number;
}

export interface GenerateCarouselResult {
  slides: GeneratedSlide[];
  total: number;
  title: string;
  ratio: CarouselRatio;
}

/**
 * Génère un carrousel à partir d'un markdown de deck.
 * Produit 1 PNG par slide via Puppeteer — texte rendu par le navigateur,
 * donc 100 % fidèle au markdown source (pas d'hallucination d'un modèle image).
 */
/**
 * Extrait le deck d'un fichier livrable Créateur :
 *  - s'il existe un bloc ```markdown ... ``` (ou ```deck) dans le fichier,
 *    on prend uniquement son contenu (le reste = metadata narrative à ignorer) ;
 *  - sinon, on utilise le markdown entier.
 * Cela évite que les sections « Contexte », « Framework », « Hook variante A »,
 * « Notes de production » etc. deviennent des slides `content` parasites.
 */
function extractDeckMarkdown(raw: string): string {
  const fenceMatch = raw.match(/```(?:markdown|deck|md)\s*\n([\s\S]*?)\n```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return raw;
}

export async function generateCarousel(
  markdown: string,
  opts: { ratio?: CarouselRatio; slug?: string } = {}
): Promise<GenerateCarouselResult> {
  const ratio: CarouselRatio = opts.ratio ?? "1:1";
  const deckMarkdown = extractDeckMarkdown(markdown);
  const deck: Presentation = parseDeckMarkdown(deckMarkdown, "Carrousel");
  if (deck.slides.length === 0) {
    throw new Error("Aucune slide détectée dans le markdown. Utilise ## [stat] Titre, ## [quote] …, etc.");
  }

  const dim = DIMENSIONS[ratio];
  const brand = deck.brand ?? "Nonvi-Efa";
  const total = deck.slides.length;

  await fs.mkdir(PUBLIC_CAROUSELS_DIR, { recursive: true });

  const slugBase = (opts.slug ?? slugifyTitle(deck.title)).slice(0, 40) || "carousel";
  const batchId = `${new Date().toISOString().slice(0, 10)}-${slugBase}-${Date.now()}`;

  const browser: Browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: dim.width, height: dim.height, deviceScaleFactor: 1 });

    const generated: GeneratedSlide[] = [];
    for (let i = 0; i < deck.slides.length; i++) {
      const html = renderCarouselSlideHTML(deck.slides[i], { brand, ratio, index: i, total });
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });

      try {
        await Promise.race([
          page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
          new Promise((r) => setTimeout(r, 5000)),
        ]);
      } catch {
        // fonts fallback
      }

      const pngBuffer = (await page.screenshot({
        type: "png",
        clip: { x: 0, y: 0, width: dim.width, height: dim.height },
      })) as Buffer;

      const filename = `${batchId}-${String(i + 1).padStart(2, "0")}.png`;
      const absPath = path.join(PUBLIC_CAROUSELS_DIR, filename);
      await fs.writeFile(absPath, pngBuffer);

      generated.push({
        index: i,
        filename,
        publicUrl: `${PUBLIC_CAROUSELS_URL}/${filename}`,
        absPath,
        bytes: pngBuffer.length,
      });
    }

    return { slides: generated, total, title: deck.title, ratio };
  } finally {
    await browser.close();
  }
}

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "carousel"
  );
}
