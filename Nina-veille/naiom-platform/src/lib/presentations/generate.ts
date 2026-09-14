import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { renderPresentationHTML, type Presentation } from "./template";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";

export const DECKS_DIR = path.resolve(process.cwd(), "..", "decks");

/**
 * Génère un PDF à partir d'une structure Presentation.
 * - Chromium headless rend le HTML en 1920×1080
 * - Chaque slide devient une page PDF paysage
 * - Si `agentSlug` est fourni, écrit dans le dossier livrables de l'agent
 *   (analytics/, gmail/, meetings/, hiring/, briefs/, content/, etc.)
 * - Sinon écrit dans decks/
 * - Retourne le chemin absolu du fichier produit
 */
export async function generatePresentationPDF(
  presentation: Presentation,
  opts: { filename?: string; agentSlug?: string } = {}
): Promise<{ path: string; filename: string; bytes: number; folderSlug: string }> {
  const html = renderPresentationHTML(presentation);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Attend que les Google Fonts soient effectivement prêtes (avec timeout de sécurité)
    try {
      await Promise.race([
        page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
        new Promise((resolve) => setTimeout(resolve, 8000)),
      ]);
    } catch {
      // noop — on continue avec les fonts fallback
    }

    const pdfBuffer = await page.pdf({
      width: "1920px",
      height: "1080px",
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const targetFolder = opts.agentSlug && DELIVERABLE_FOLDERS[opts.agentSlug]
      ? DELIVERABLE_FOLDERS[opts.agentSlug].abs
      : DECKS_DIR;
    const folderSlug = opts.agentSlug && DELIVERABLE_FOLDERS[opts.agentSlug]
      ? opts.agentSlug
      : "presentateur";

    await fs.mkdir(targetFolder, { recursive: true });
    const filename = opts.filename || `${slugifyForFilename(presentation.title)}.pdf`;
    const absPath = path.join(targetFolder, filename);
    await fs.writeFile(absPath, pdfBuffer);

    return {
      path: absPath,
      filename,
      bytes: pdfBuffer.length,
      folderSlug,
    };
  } finally {
    await browser.close();
  }
}

function slugifyForFilename(title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${date}-naiom-${slug || "presentation"}`;
}
