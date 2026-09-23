import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { renderReportHTML, type Report } from "./template";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";

/**
 * Génère un PDF "rapport" (format A4 portrait multi-page) et le sauvegarde
 * dans le dossier de livrables de l'agent.
 */
export async function generateReportPDF(
  report: Report,
  options: { agentSlug: keyof typeof DELIVERABLE_FOLDERS; filename?: string }
): Promise<{ path: string; filename: string; bytes: number }> {
  const folder = DELIVERABLE_FOLDERS[options.agentSlug];
  if (!folder) {
    throw new Error(`Agent ${options.agentSlug} n'a pas de dossier de livrables configuré.`);
  }

  const html = renderReportHTML(report);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });

    try {
      await Promise.race([
        page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
        new Promise((r) => setTimeout(r, 6000)),
      ]);
    } catch {
      // fonts fallback
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const filename = options.filename ?? slugifyForFilename(report.title, options.agentSlug);
    const absPath = path.join(folder.abs, filename);
    await fs.mkdir(folder.abs, { recursive: true });
    await fs.writeFile(absPath, pdfBuffer);

    return { path: absPath, filename, bytes: pdfBuffer.length };
  } finally {
    await browser.close();
  }
}

function slugifyForFilename(title: string, agentSlug: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return `${date}-Nonvi-Efa-${agentSlug}-${slug || "rapport"}.pdf`;
}
