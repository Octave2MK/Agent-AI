import fs from "node:fs/promises";
import path from "node:path";
import puppeteer, { type Browser } from "puppeteer";
import type { TextSide } from "./prompts";

/**
 * Incruste le titre par-dessus le visuel généré (Nano Banana) via Puppeteer.
 * Le texte est rendu par le navigateur → typographie 100 % nette, aucun risque
 * d'hallucination. Sortie : un PNG 1280×720 prêt pour YouTube.
 */

export const PUBLIC_THUMBS_DIR = path.join(process.cwd(), "public", "generated-thumbnails");
export const PUBLIC_THUMBS_URL = "/generated-thumbnails";

const WIDTH = 1280;
const HEIGHT = 720;

const COLOR = {
  ink: "#FFFFFF",
  accent: "#F5C04E", // jaune chaud, contraste fort sur quasi tous les fonds
  shadow: "rgba(0,0,0,0.85)",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** *mot* → accent jaune. Reste en blanc. Échappe d'abord le HTML. */
function renderTitleInline(title: string): string {
  return escapeHtml(title).replace(
    /\*([^*]+)\*/g,
    `<span style="color:${COLOR.accent}">$1</span>`
  );
}

/** Taille de police adaptée à la longueur du titre (sans déborder). */
function fontSizeFor(title: string): number {
  const len = title.replace(/\*/g, "").length;
  if (len <= 18) return 104;
  if (len <= 30) return 88;
  if (len <= 45) return 72;
  if (len <= 65) return 58;
  return 48;
}

function renderHTML(opts: { bgDataUri: string; title: string; textSide: TextSide }): string {
  const { bgDataUri, title, textSide } = opts;
  const fs = fontSizeFor(title);
  const align = textSide === "left" ? "flex-start" : "flex-end";
  const textAlign = textSide === "left" ? "left" : "right";
  // Dégradé d'assombrissement du côté du texte, pour garantir la lisibilité.
  const scrim =
    textSide === "left"
      ? "linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0) 70%)"
      : "linear-gradient(to left, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 42%, rgba(0,0,0,0) 70%)";
  const badgeSide = textSide === "left" ? "right: 40px;" : "left: 40px;";

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; }
    .stage {
      position:relative; width:${WIDTH}px; height:${HEIGHT}px;
      background:#0a1410; overflow:hidden;
      font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;
    }
    .bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .scrim { position:absolute; inset:0; background:${scrim}; }
    .text-layer {
      position:absolute; inset:0; padding:70px 80px;
      display:flex; flex-direction:column; justify-content:center;
      align-items:${align};
    }
    .title {
      max-width:62%;
      text-align:${textAlign};
      color:${COLOR.ink};
      font-weight:900;
      font-size:${fs}px;
      line-height:1.02;
      letter-spacing:-0.015em;
      text-transform:uppercase;
      text-shadow:0 4px 18px ${COLOR.shadow}, 0 2px 4px ${COLOR.shadow};
      -webkit-text-stroke:1.5px rgba(0,0,0,0.35);
    }
    .accent-bar {
      width:84px; height:10px; border-radius:6px;
      background:${COLOR.accent};
      margin-bottom:26px;
      box-shadow:0 3px 10px rgba(0,0,0,0.5);
    }
    .badge {
      position:absolute; bottom:34px; ${badgeSide}
      display:flex; align-items:center; gap:9px;
      padding:9px 16px; border-radius:999px;
      background:rgba(10,20,16,0.72); backdrop-filter:blur(4px);
      border:1px solid rgba(255,255,255,0.18);
    }
    .badge .dot { width:9px; height:9px; border-radius:50%; background:#34d399; }
    .badge .name {
      color:#fff; font-family:'Helvetica Neue',Arial,sans-serif;
      font-weight:800; font-size:20px; letter-spacing:0.04em;
    }
  </style></head><body>
    <div class="stage">
      <img class="bg" src="${bgDataUri}" />
      <div class="scrim"></div>
      <div class="text-layer">
        <div class="accent-bar" style="align-self:${align}"></div>
        <div class="title">${renderTitleInline(title)}</div>
      </div>
      <div class="badge"><span class="dot"></span><span class="name">NAIOM</span></div>
    </div>
  </body></html>`;
}

export interface ComposeResult {
  filename: string;
  publicUrl: string;
  absPath: string;
  bytes: number;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "miniature"
  );
}

/**
 * Compose une miniature finale : visuel généré (PNG sur disque) + titre incrusté.
 * `browser` peut être partagé entre plusieurs appels pour éviter de relancer
 * Chromium à chaque image.
 */
export async function composeThumbnail(
  visualAbsPath: string,
  title: string,
  textSide: TextSide,
  opts: { browser?: Browser; slug?: string } = {}
): Promise<ComposeResult> {
  const buf = await fs.readFile(visualAbsPath);
  const ext = path.extname(visualAbsPath).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  const bgDataUri = `data:${mime};base64,${buf.toString("base64")}`;

  const html = renderHTML({ bgDataUri, title, textSide });

  const ownBrowser = !opts.browser;
  const browser =
    opts.browser ??
    (await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    }));

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    try {
      await Promise.race([
        page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
    } catch {
      /* fallback fonts */
    }

    const pngBuffer = (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    })) as Buffer;

    await page.close();

    await fs.mkdir(PUBLIC_THUMBS_DIR, { recursive: true });
    const filename = `${new Date().toISOString().slice(0, 10)}-${opts.slug ?? slugify(title)}-${Date.now()}.png`;
    const absPath = path.join(PUBLIC_THUMBS_DIR, filename);
    await fs.writeFile(absPath, pngBuffer);

    return {
      filename,
      publicUrl: `${PUBLIC_THUMBS_URL}/${filename}`,
      absPath,
      bytes: pngBuffer.length,
    };
  } finally {
    if (ownBrowser) await browser.close();
  }
}

export { puppeteer };
