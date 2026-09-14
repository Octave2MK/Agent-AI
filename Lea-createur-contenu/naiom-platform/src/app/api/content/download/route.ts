import puppeteer from "puppeteer";
import { getPost } from "@/lib/content/store";

export const runtime = "nodejs";
export const maxDuration = 90;

const TMPL: Record<string, { bg: string; fg: string; accent: string; sub: string; font: string }> = {
  Minimal: { bg: "#ffffff", fg: "#141414", accent: "#F5411C", sub: "#6b7280", font: "'Archivo',sans-serif" },
  Bold: { bg: "#141414", fg: "#ffffff", accent: "#F5411C", sub: "#a7abb6", font: "'Archivo',sans-serif" },
  Gradient: { bg: "linear-gradient(135deg,#F5411C,#5B4DEE)", fg: "#ffffff", accent: "#ffffff", sub: "rgba(255,255,255,.85)", font: "'Archivo',sans-serif" },
  "Éditorial": { bg: "#FAF6F4", fg: "#1a1a1a", accent: "#5B4DEE", sub: "#7a7a7a", font: "Georgia,serif" },
};
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function slideHTML(t: { bg: string; fg: string; accent: string; sub: string; font: string }, title: string, body: string, i: number, total: number) {
  const cover = i === 0, last = i === total - 1;
  return `<div class="slide" style="background:${t.bg};color:${t.fg};font-family:${t.font}">
    <div class="row"><span class="brand" style="color:${t.accent}">NAIOM</span>${!cover ? `<span class="pg" style="color:${t.sub}">${i + 1}/${total}</span>` : ""}</div>
    <div class="mid">
      ${!cover && !last ? `<span class="num" style="background:${t.accent};color:${t.bg.includes("gradient") ? "#F5411C" : t.bg}">${i}</span>` : ""}
      <div class="title" style="font-size:${cover ? 64 : 46}px">${esc(title)}</div>
      ${body ? `<div class="body" style="color:${t.sub};font-size:${cover ? 30 : 28}px">${esc(body)}</div>` : ""}
    </div>
    <div class="row foot" style="color:${t.sub}"><span>@naiom.agency</span><span style="color:${t.accent}">${cover ? "Swipe →" : last ? "↗ Contactez-nous" : "→"}</span></div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const { id } = (await req.json()) as { id?: string };
    if (!id) return Response.json({ error: "id requis" }, { status: 400 });
    const post = await getPost(id);
    if (!post) return Response.json({ error: "Post introuvable" }, { status: 404 });
    const t = TMPL[post.template ?? "Minimal"] ?? TMPL.Minimal;
    const r = post.result;

    let slides: { title: string; body: string }[] = [];
    if (r.slides?.length) slides = r.slides;
    else if (r.headline) slides = [{ title: r.headline, body: "" }];
    else if (r.tweets?.length) slides = r.tweets.map((x, i) => ({ title: i === 0 ? x : "", body: i === 0 ? "" : x }));
    else if (r.body) slides = [{ title: "", body: r.body }];
    const total = slides.length || 1;

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size:1080px 1080px; margin:0; }
    *{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .slide{width:1080px;height:1080px;padding:90px;display:flex;flex-direction:column;justify-content:space-between;page-break-after:always}
    .row{display:flex;justify-content:space-between;align-items:center}
    .brand{font-size:26px;font-weight:800;letter-spacing:.12em}.pg{font-size:24px;font-weight:700}
    .mid{flex:1;display:flex;flex-direction:column;justify-content:center;padding:40px 0}
    .num{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;margin-bottom:28px}
    .title{font-weight:800;line-height:1.05;letter-spacing:-.01em}
    .body{margin-top:26px;line-height:1.35}
    .foot{font-size:24px;font-weight:700}
    </style></head><body>${slides.map((s, i) => slideHTML(t, s.title, s.body, i, total)).join("")}</body></html>`;

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 500));
      const pdf = await page.pdf({ width: "1080px", height: "1080px", printBackground: true, pageRanges: "" });
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="naiom-${post.platform}-${post.id}.pdf"`,
        },
      });
    } finally { await browser.close(); }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
