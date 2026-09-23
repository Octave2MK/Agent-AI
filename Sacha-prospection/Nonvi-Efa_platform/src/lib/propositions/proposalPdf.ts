/**
 * Rendu PDF PRO d'une proposition commerciale Nonvi-Efa (Victor).
 * A4. Couverture pleine + contenu en FLUX CONTINU (pas de sauts de page rigides →
 * aucune demi-page blanche), schémas de process, blocs before→after, tableau
 * d'investissement, planning. L'email n'est PAS dans le PDF.
 */
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import type { Proposal, Solution } from "./proposal";

const C = { orange: "#F5411C", violet: "#5B4DEE", ink: "#141414", soft: "#5b6170", line: "#e8e8ee", wash: "#FAF6F4" };
const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function flow(steps: string[], variant: "muted" | "accent"): string {
  const bg = variant === "accent" ? "#EEF0FF" : "#F3F3F6";
  const bd = variant === "accent" ? C.violet : "#c9ccd6";
  const fg = variant === "accent" ? C.violet : "#4a4f5c";
  return `<div class="flow">${steps
    .map((s, i) => `<div class="node" style="background:${bg};border-color:${bd};color:${fg}">${esc(s)}</div>` + (i < steps.length - 1 ? `<div class="arrow" style="color:${bd}">→</div>` : ""))
    .join("")}</div>`;
}

function solutionBlock(s: Solution, i: number): string {
  return `<section class="sol">
    <div class="sol-head"><span class="sol-num">${i + 1}</span><h3>${esc(s.title)}</h3></div>
    <p class="sol-problem"><b>Problème :</b> ${esc(s.problem)}</p>
    <p class="sol-how">${esc(s.how)}</p>
    <div class="ba">
      <div><div class="ba-label ba-before">Aujourd'hui — manuel</div>${flow(s.before, "muted")}</div>
      <div style="margin-top:8px"><div class="ba-label ba-after">Avec Nonvi-Efa — automatisé</div>${flow(s.after, "accent")}</div>
    </div>
    <div class="sol-foot">
      <div class="tools">${s.tools.map((t) => `<span class="tool">${esc(t)}</span>`).join("")}</div>
      <div class="gain">⚡ ${esc(s.gain)}</div>
    </div>
    <div class="sol-price"><span>Mise en place <b>${eur(s.setup)}</b></span>${s.recurring ? `<span>Maintenance <b>${eur(s.recurring)}/mois</b></span>` : ""}</div>
  </section>`;
}

function renderHTML(p: Proposal): string {
  const highlights = p.solutions.slice(0, 3).map((s) => esc(s.title));
  const totalMonthly = p.pricing.totalRecurring ? ` <span class="sub">+ ${eur(p.pricing.totalRecurring)}/mois</span>` : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@page { size:A4; margin:16mm 15mm; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Archivo','Helvetica Neue',Arial,sans-serif; color:${C.ink}; font-size:11.5px; line-height:1.5; }

/* ---- COVER (remplit la zone imprimable, dans les marges → pas de page blanche) ---- */
.cover { position:relative; min-height:262mm; padding:24mm 22mm; background:${C.ink}; color:#fff; display:flex; flex-direction:column; border-radius:14px; break-after:page; page-break-after:always; }
.cover .brand{ font-size:30px; font-weight:800; letter-spacing:-.02em; } .cover .brand .dot{ color:${C.orange}; }
.cover .brand-tag{ color:#b9bcc7; font-size:12px; margin-top:3px; }
.cover .kicker{ color:${C.orange}; font-weight:800; letter-spacing:.16em; font-size:11px; text-transform:uppercase; margin-top:52px; }
.cover h1{ font-size:40px; font-weight:800; line-height:1.06; letter-spacing:-.02em; margin:12px 0 16px; max-width:150mm; }
.cover .promise{ font-size:15px; color:#e7e8ee; line-height:1.5; max-width:150mm; }
.cover .hls{ margin-top:30px; display:flex; flex-direction:column; gap:10px; }
.cover .hl{ display:flex; align-items:center; gap:12px; font-size:14px; font-weight:600; color:#f4f5f8; }
.cover .hl .b{ width:26px;height:26px;border-radius:8px;background:${C.orange};color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none; }
.cover .foot{ margin-top:auto; }
.cover .for{ font-size:14px; color:#cfd1da; }
.cover .for b{ color:#fff; }
.cover .meta{ display:flex; gap:30px; margin-top:16px; border-top:1px solid rgba(255,255,255,.16); padding-top:16px; }
.cover .meta .k{ font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#8b8f9c; }
.cover .meta .v{ font-size:13px;font-weight:700;margin-top:3px; }

/* ---- BODY (flux continu) ---- */
h2.sec{ font-size:16px;font-weight:800;letter-spacing:-.01em;margin:0 0 5px; break-after:avoid; page-break-after:avoid; }
h2.sec .bar{ display:inline-block;width:26px;height:3px;background:${C.orange};vertical-align:middle;margin-right:8px;border-radius:2px; }
.block{ margin-top:22px; }
.lead{ color:${C.soft}; margin-bottom:12px; }
.summary{ background:${C.wash}; border-left:3px solid ${C.orange}; padding:13px 15px; border-radius:6px; font-size:12.5px; margin-bottom:12px; break-inside:avoid; }
.context{ margin-bottom:2px; }

.proc{ display:flex;flex-direction:column;gap:7px;margin-top:8px; }
.proc-row{ display:flex;align-items:center;gap:10px; break-inside:avoid; }
.proc-idx{ width:22px;height:22px;border-radius:50%;background:${C.ink};color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none; }
.proc-step{ font-weight:700;font-size:12px;flex:none;width:34%; }
.proc-pain{ color:#b91c1c;font-size:11px;background:#FEecec;padding:4px 9px;border-radius:6px;flex:1; }

.flow{ display:flex;align-items:center;flex-wrap:wrap;gap:6px; }
.node{ border:1px solid;border-radius:8px;padding:6px 10px;font-size:10.5px;font-weight:700; }
.arrow{ font-size:14px;font-weight:800; }

.sol{ border:1px solid ${C.line};border-radius:12px;padding:14px 16px;margin-bottom:13px;break-inside:avoid;page-break-inside:avoid; }
.sol-head{ display:flex;align-items:center;gap:10px;margin-bottom:5px; }
.sol-num{ width:24px;height:24px;border-radius:7px;background:${C.violet};color:#fff;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center; }
.sol-head h3{ font-size:14.5px;font-weight:800; }
.sol-problem{ font-size:11.5px;margin-bottom:2px; }
.sol-how{ color:${C.soft};font-size:11.5px;margin-bottom:9px; }
.ba{ background:${C.wash};border-radius:8px;padding:11px; }
.ba-label{ font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px; }
.ba-before{ color:#9aa0ad; } .ba-after{ color:${C.violet}; }
.sol-foot{ display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:9px; }
.tools{ display:flex;gap:5px;flex-wrap:wrap; }
.tool{ background:#EEF0FF;color:${C.violet};font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px; }
.gain{ font-size:11px;font-weight:800;color:${C.orange};text-align:right; }
.sol-price{ display:flex;gap:18px;margin-top:9px;border-top:1px dashed ${C.line};padding-top:8px;font-size:12px; }

table.price{ width:100%;border-collapse:collapse;margin-top:8px;break-inside:avoid; }
table.price th{ text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:${C.soft};padding:9px 12px;background:${C.wash}; }
table.price th.r,table.price td.r{ text-align:right; }
table.price td{ padding:10px 12px;border-bottom:1px solid ${C.line};font-size:12px; }
.totbox{ margin-top:14px;background:${C.ink};color:#fff;border-radius:12px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;break-inside:avoid; }
.totbox .k{ font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#9aa0ad;font-weight:700; }
.totbox .v{ font-size:28px;font-weight:800;margin-top:3px; } .totbox .v .sub{ font-size:14px;color:#b9bcc7;font-weight:700; }
.totbox .note{ font-size:11px;color:#b9bcc7;max-width:60mm;text-align:right; }

.tl{ display:flex;gap:0;margin-top:10px;break-inside:avoid; }
.tl-item{ flex:1;text-align:center;position:relative;padding-top:22px; }
.tl-item:before{ content:"";position:absolute;top:7px;left:0;right:0;height:2px;background:${C.line}; }
.tl-item:first-child:before{ left:50%; } .tl-item:last-child:before{ right:50%; }
.tl-dot{ position:absolute;top:2px;left:50%;transform:translateX(-50%);width:12px;height:12px;border-radius:50%;background:${C.orange}; }
.tl-phase{ font-size:10px;font-weight:800;color:${C.orange}; }
.tl-label{ font-size:11px;margin-top:3px;padding:0 5px;color:${C.soft}; }

.steps{ margin-top:8px; }
.step{ display:flex;gap:10px;align-items:flex-start;margin-bottom:7px;break-inside:avoid; }
.step .n{ width:22px;height:22px;border-radius:50%;background:${C.violet};color:#fff;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center;flex:none; }
.cta{ margin-top:16px;background:${C.wash};border-radius:12px;padding:15px 18px;text-align:center;font-size:12.5px;break-inside:avoid; }
.cta b{ color:${C.orange}; }
.sign{ margin-top:14px;font-size:11px;color:${C.soft};border-top:1px solid ${C.line};padding-top:10px; }
</style></head><body>

<div class="cover">
  <div><div class="brand">Nonvi-Efa<span class="dot">.</span></div><div class="brand-tag">Ingénierie d'agents IA & automatisations</div></div>
  <div class="kicker">Proposition commerciale — ${esc(p.reference)}</div>
  <h1>${esc(p.prospect)} :<br>automatiser vos process, récupérer votre temps.</h1>
  <div class="promise">${esc(p.executiveSummary)}</div>
  <div class="hls">
    ${highlights.map((h, i) => `<div class="hl"><span class="b">${i + 1}</span>${h}</div>`).join("")}
  </div>
  <div class="foot">
    <div class="for">Préparée pour <b>${esc(p.prospect)}</b>${p.contactName ? ` — à l'attention de ${esc(p.contactName)}` : ""}</div>
    <div class="meta">
      <div><div class="k">Secteur</div><div class="v">${esc(p.sector)}</div></div>
      <div><div class="k">Référence</div><div class="v">${esc(p.reference)}</div></div>
      <div><div class="k">Date</div><div class="v">${esc(p.date)}</div></div>
      <div><div class="k">Investissement</div><div class="v">${eur(p.pricing.totalSetup)}${p.pricing.totalRecurring ? " + abo" : ""}</div></div>
    </div>
  </div>
</div>

<div class="block" style="margin-top:0">
  <h2 class="sec"><span class="bar"></span>Votre situation</h2>
  <div class="summary">${esc(p.executiveSummary)}</div>
  <p class="context">${esc(p.context)}</p>
</div>

<div class="block">
  <h2 class="sec"><span class="bar"></span>Analyse de vos process actuels</h2>
  <p class="lead">${esc(p.processIntro)}</p>
  <div class="proc">
    ${p.currentProcess.map((s, i) => `<div class="proc-row"><span class="proc-idx">${i + 1}</span><span class="proc-step">${esc(s.step)}</span><span class="proc-pain">⚠ ${esc(s.pain)}</span></div>`).join("")}
  </div>
</div>

<div class="block">
  <h2 class="sec"><span class="bar"></span>Solutions proposées</h2>
  <p class="lead">Chaque automatisation cible une douleur identifiée, avec le flux avant / après.</p>
  ${p.solutions.map((s, i) => solutionBlock(s, i)).join("")}
</div>

<div class="block">
  <h2 class="sec"><span class="bar"></span>Investissement</h2>
  <table class="price">
    <thead><tr><th>Poste</th><th class="r">Type</th><th class="r">Montant</th></tr></thead>
    <tbody>
      ${p.pricing.items.map((it) => `<tr><td>${esc(it.label)}</td><td class="r" style="color:${C.soft}">${it.type === "setup" ? "Mise en place" : "Mensuel"}</td><td class="r"><b>${eur(it.amount)}</b></td></tr>`).join("")}
    </tbody>
  </table>
  <div class="totbox">
    <div><div class="k">Total mise en place</div><div class="v">${eur(p.pricing.totalSetup)}${totalMonthly}</div></div>
    <div class="note">Périmètre modulable — chaque automatisation peut être déployée séparément.</div>
  </div>
</div>

<div class="block">
  <h2 class="sec"><span class="bar"></span>Déroulé du projet</h2>
  <div class="tl">${p.timeline.map((t) => `<div class="tl-item"><div class="tl-dot"></div><div class="tl-phase">${esc(t.phase)}</div><div class="tl-label">${esc(t.label)}</div></div>`).join("")}</div>
</div>

<div class="block">
  <h2 class="sec"><span class="bar"></span>Prochaines étapes</h2>
  <div class="steps">${p.nextSteps.map((s, i) => `<div class="step"><span class="n">${i + 1}</span><span>${esc(s)}</span></div>`).join("")}</div>
  <div class="cta">Une question, un ajustement du périmètre ? <b>Répondez simplement à ce message</b> — on cale un point de 15 min.</div>
  <div class="sign">Nonvi-Efa Agency · Nonvi-Efaagency@gmail.com · Proposition ${esc(p.reference)} — ${esc(p.prospect)}</div>
</div>

</body></html>`;
}

export async function generateProposalPDF(p: Proposal): Promise<{ path: string; filename: string; bytes: number }> {
  const folder = DELIVERABLE_FOLDERS.proposition;
  const html = renderHTML(p);
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    await Promise.race([
      page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
      new Promise((r) => setTimeout(r, 4000)),
    ]).catch(() => {});
    const buf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
    const safe = p.reference.replace(/[^\w-]+/g, "-");
    const filename = `proposition-${safe}.pdf`;
    await fs.mkdir(folder.abs, { recursive: true });
    const absPath = path.join(folder.abs, filename);
    await fs.writeFile(absPath, buf);
    return { path: absPath, filename, bytes: buf.length };
  } finally {
    await browser.close();
  }
}
