/**
 * Générateur HTML de présentations — reproduit fidèlement le template Nonvi-Efa
 * (fond crème, typo Inter Black extra-bold, gradients flous orange/rose/violet,
 * footer 3 colonnes date · page · brand).
 */

export interface SlideTitle {
  kind: "title";
  category?: string; // petit texte en haut (ex. "Nonvi-Efa")
  title: string;
  subtitle?: string;
}

export interface SlideToc {
  kind: "toc";
  items: { num: string; label: string }[]; // 4-8 items idéalement
}

export interface SlideContent {
  kind: "content";
  title: string;
  body: string; // plusieurs paragraphes OK (séparés par \n\n)
}

export interface SlideStat {
  kind: "stat";
  title: string;
  bigValue: string; // ex. "70 %"
  caption: string;
  body?: string;
}

export interface SlideBars {
  kind: "bars";
  title: string;
  body?: string;
  data: { label: string; value: number }[];
}

export interface SlideLine {
  kind: "line";
  title: string;
  body?: string;
  data: { label: string; value: number }[];
}

export interface SlideQuote {
  kind: "quote";
  quote: string;
  attribution?: string;
}

export interface SlideThanks {
  kind: "thanks";
  title?: string; // défaut: "merci"
  body?: string;
  resources?: string[];
}

export interface SlideCompare {
  kind: "compare";
  title: string;
  leftLabel: string;
  leftItems: string[];
  rightLabel: string;
  rightItems: string[];
}

export interface SlideFlow {
  kind: "flow";
  title: string;
  steps: { label: string; caption?: string }[];
  body?: string;
}

export interface SlidePillars {
  kind: "pillars";
  title: string;
  pillars: { title: string; description: string }[];
}

export interface SlideKpi {
  kind: "kpi";
  title: string;
  body?: string;
  cards: { value: string; label: string; delta?: string; deltaKind?: "up" | "down" | "flat" }[];
}

// Matrice 2×2 type "Gartner Magic Quadrant" / matrice risques impact×probabilité
export interface SlideMatrix {
  kind: "matrix";
  title: string;
  body?: string;
  xAxis: { label: string; low: string; high: string };
  yAxis: { label: string; low: string; high: string };
  quadrants?: { tl?: string; tr?: string; bl?: string; br?: string }; // étiquettes optionnelles des 4 quadrants
  points: { label: string; x: number; y: number; highlight?: boolean }[]; // coords normalisées 0..1
}

// Chaîne de valeur : un hub central + nœuds dépendants (type "hardware → services")
export interface SlideValueChain {
  kind: "valuechain";
  title: string;
  body?: string;
  hub: { label: string; caption?: string };
  nodes: { label: string; caption?: string }[]; // 3-6 nœuds
}

// Org chart / succession : root + enfants (1 niveau)
export interface SlideOrgChart {
  kind: "orgchart";
  title: string;
  body?: string;
  root: { label: string; role?: string; caption?: string };
  children: { label: string; role?: string; caption?: string }[]; // 2-4 enfants
}

export type Slide =
  | SlideTitle
  | SlideToc
  | SlideContent
  | SlideStat
  | SlideBars
  | SlideLine
  | SlideKpi
  | SlideQuote
  | SlideThanks
  | SlideCompare
  | SlideFlow
  | SlidePillars
  | SlideMatrix
  | SlideValueChain
  | SlideOrgChart;

export interface Presentation {
  title: string; // pour metadata PDF
  brand?: string; // footer droit — défaut "Nonvi-Efa"
  date?: string; // footer gauche — défaut mois/année courant
  slides: Slide[];
}

// ---- Couleurs Nonvi-Efa (dérivées du template client) ----
const COLOR = {
  bg: "#E8E4DD",
  ink: "#121212",
  accent: "#E8461F", // orange primaire
  accent2: "#F57444", // orange clair
  pink: "#F574AB",
  purple: "#B464D3",
  line: "#DAD7D0",
};

function fmtDate(d?: string): string {
  const now = new Date();
  if (d) return d.toUpperCase();
  const months = ["JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE"];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pageNum(i: number, total: number): string {
  return `${String(i + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
}

function renderFooter(i: number, total: number, p: Presentation): string {
  const date = fmtDate(p.date);
  const brand = (p.brand ?? "Nonvi-Efa").toUpperCase();
  return `<footer class="footer">
    <span class="footer-left">${escapeHtml(date)}</span>
    <span class="footer-center">${pageNum(i, total)}</span>
    <span class="footer-right">${escapeHtml(brand)}</span>
  </footer>`;
}

// ---- Gradients SVG ----
function gradientBlob(opts: { cx: number; cy: number; r: number; color: string; opacity?: number }): string {
  return `<div class="gradient-blob" style="
    left:${opts.cx}%;
    top:${opts.cy}%;
    width:${opts.r}%;
    height:${opts.r}%;
    background: radial-gradient(circle, ${opts.color} 0%, ${opts.color}CC 25%, transparent 60%);
    opacity: ${opts.opacity ?? 0.85};
  "></div>`;
}

function multiGradientBackground(variant: "title" | "section" | "minimal" = "section"): string {
  if (variant === "title") {
    return `
      ${gradientBlob({ cx: -15, cy: -10, r: 60, color: COLOR.accent, opacity: 0.8 })}
      ${gradientBlob({ cx: 65, cy: 20, r: 50, color: COLOR.accent2, opacity: 0.75 })}
      ${gradientBlob({ cx: 40, cy: 70, r: 45, color: COLOR.pink, opacity: 0.6 })}
    `;
  }
  if (variant === "section") {
    return `
      ${gradientBlob({ cx: 60, cy: -10, r: 50, color: COLOR.accent, opacity: 0.7 })}
      ${gradientBlob({ cx: 75, cy: 55, r: 40, color: COLOR.pink, opacity: 0.6 })}
      ${gradientBlob({ cx: 90, cy: 85, r: 35, color: COLOR.purple, opacity: 0.5 })}
    `;
  }
  return "";
}

// ---- Auto-sizing des titres ----

/**
 * Calcule une taille de police pour les titres hero en fonction de la longueur du texte.
 * Le but : éviter qu'un titre long déborde de la slide.
 */
function calcHeroSize(text: string): number {
  const len = text.length;
  if (len <= 12) return 240;
  if (len <= 20) return 200;
  if (len <= 32) return 160;
  if (len <= 48) return 130;
  if (len <= 64) return 105;
  return 85;
}

function calcSectionSize(text: string): number {
  const len = text.length;
  if (len <= 14) return 180;
  if (len <= 24) return 150;
  if (len <= 36) return 120;
  if (len <= 52) return 95;
  return 75;
}

// ---- Slide renderers ----

function renderTitle(s: SlideTitle, i: number, total: number, p: Presentation): string {
  const size = calcHeroSize(s.title);
  return `<section class="slide slide-title">
    ${multiGradientBackground("title")}
    <div class="title-category">${escapeHtml(s.category ?? (p.brand ?? "Nonvi-Efa").toUpperCase())}</div>
    <h1 class="title-hero" style="font-size:${size}px">${escapeHtml(s.title)}</h1>
    ${s.subtitle ? `<p class="title-subtitle">${escapeHtml(s.subtitle)}</p>` : ""}
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderToc(s: SlideToc, i: number, total: number, p: Presentation): string {
  const items = s.items.slice(0, 8);
  const mid = Math.ceil(items.length / 2);
  const left = items.slice(0, mid);
  const right = items.slice(mid);
  const col = (list: typeof items) =>
    list
      .map(
        (it) =>
          `<div class="toc-item">
            <div class="toc-num">${escapeHtml(it.num)}</div>
            <div class="toc-label">${escapeHtml(it.label)}</div>
          </div>`
      )
      .join("");
  return `<section class="slide slide-toc">
    <div class="toc-grid">
      <div class="toc-col">${col(left)}</div>
      <div class="toc-col">${col(right)}</div>
    </div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderContent(s: SlideContent, i: number, total: number, p: Presentation): string {
  const paragraphs = s.body.split(/\n\n+/).map((para) => `<p>${escapeHtml(para.trim())}</p>`).join("");
  const size = calcSectionSize(s.title);
  return `<section class="slide slide-content">
    ${multiGradientBackground("section")}
    <h1 class="section-title" style="font-size:${size}px">${escapeHtml(s.title)}</h1>
    <div class="content-body">${paragraphs}</div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderStat(s: SlideStat, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  // Pour le bigValue, si long (ex. "1 230 €") on réduit
  const valSize = s.bigValue.length > 6 ? 260 : s.bigValue.length > 4 ? 320 : 380;
  return `<section class="slide slide-stat">
    ${multiGradientBackground("section")}
    <h1 class="section-title" style="font-size:${size}px">${escapeHtml(s.title)}</h1>
    <div class="stat-wrap">
      <div class="stat-value" style="font-size:${valSize}px">${escapeHtml(s.bigValue)}</div>
      <div class="stat-caption">${escapeHtml(s.caption)}</div>
    </div>
    ${s.body ? `<p class="stat-body">${escapeHtml(s.body)}</p>` : ""}
    ${renderFooter(i, total, p)}
  </section>`;
}

// ---- Schémas : Compare / Flow / Pillars ----

function renderCompare(s: SlideCompare, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const renderCol = (label: string, items: string[], variant: "bad" | "good") => `
    <div class="compare-col compare-${variant}">
      <div class="compare-col-head">
        <span class="compare-badge">${variant === "bad" ? "✗" : "✓"}</span>
        ${escapeHtml(label)}
      </div>
      <ul class="compare-list">
        ${items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
      </ul>
    </div>`;
  return `<section class="slide slide-compare">
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    <div class="compare-grid">
      ${renderCol(s.leftLabel, s.leftItems, "bad")}
      ${renderCol(s.rightLabel, s.rightItems, "good")}
    </div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderFlow(s: SlideFlow, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const boxes = s.steps.map((step, idx) => `
    <div class="flow-item">
      <div class="flow-num">${String(idx + 1).padStart(2, "0")}</div>
      <div class="flow-label">${escapeHtml(step.label)}</div>
      ${step.caption ? `<div class="flow-caption">${escapeHtml(step.caption)}</div>` : ""}
    </div>
    ${idx < s.steps.length - 1 ? `<div class="flow-arrow">→</div>` : ""}
  `).join("");
  return `<section class="slide slide-flow">
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="flow-body">${escapeHtml(s.body)}</p>` : ""}
    <div class="flow-row">${boxes}</div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderKpi(s: SlideKpi, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const cards = s.cards.slice(0, 4).map((c) => {
    const valLen = c.value.length;
    const valSize = valLen > 8 ? 72 : valLen > 5 ? 100 : 128;
    const deltaClass = c.deltaKind === "down" ? "kpi-delta-down" : c.deltaKind === "flat" ? "kpi-delta-flat" : "kpi-delta-up";
    const deltaIcon = c.deltaKind === "down" ? "▼" : c.deltaKind === "flat" ? "→" : "▲";
    return `
      <div class="kpi-card">
        <div class="kpi-value" style="font-size:${valSize}px">${escapeHtml(c.value)}</div>
        <div class="kpi-label">${escapeHtml(c.label)}</div>
        ${c.delta ? `<div class="kpi-delta ${deltaClass}"><span class="kpi-delta-icon">${deltaIcon}</span>${escapeHtml(c.delta)}</div>` : ""}
      </div>
    `;
  }).join("");
  return `<section class="slide slide-kpi">
    ${multiGradientBackground("section")}
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="kpi-body">${escapeHtml(s.body)}</p>` : ""}
    <div class="kpi-grid" data-cols="${Math.min(s.cards.length, 4)}">${cards}</div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderPillars(s: SlidePillars, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const cols = s.pillars.map((pil, idx) => `
    <div class="pillar">
      <div class="pillar-num">${String(idx + 1).padStart(2, "0")}</div>
      <div class="pillar-title">${escapeHtml(pil.title)}</div>
      <div class="pillar-desc">${escapeHtml(pil.description)}</div>
    </div>
  `).join("");
  return `<section class="slide slide-pillars">
    ${multiGradientBackground("section")}
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    <div class="pillars-grid" data-cols="${s.pillars.length}">${cols}</div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderBars(s: SlideBars, i: number, total: number, p: Presentation): string {
  const max = Math.max(...s.data.map((d) => d.value), 1);
  const bars = s.data
    .map(
      (d) => `
      <div class="bar-row">
        <div class="bar-label">${escapeHtml(d.label)}</div>
        <div class="bar-track">
          <div class="bar-fill bar-fill-dark" style="width:${(d.value / max) * 70}%"></div>
          <div class="bar-fill bar-fill-light" style="width:${(d.value / max) * 100}%"></div>
        </div>
        <div class="bar-value">${d.value}</div>
      </div>`
    )
    .join("");
  return `<section class="slide slide-bars">
    <h1 class="section-title small">${escapeHtml(s.title)}</h1>
    <div class="bars-wrap">
      <div class="bars">${bars}</div>
      ${s.body ? `<div class="bars-body"><p>${escapeHtml(s.body).replace(/\n\n/g, "</p><p>")}</p></div>` : ""}
    </div>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderLine(s: SlideLine, i: number, total: number, p: Presentation): string {
  const w = 1200;
  const h = 380;
  const padL = 60;
  const padR = 30;
  const padT = 20;
  const padB = 50;
  const vals = s.data.map((d) => d.value);
  const maxV = Math.max(...vals, 1);
  const minV = Math.min(...vals, 0);
  const range = maxV - minV || 1;
  const step = (w - padL - padR) / Math.max(1, s.data.length - 1);
  const points = s.data.map((d, idx) => {
    const x = padL + idx * step;
    const y = padT + (h - padT - padB) * (1 - (d.value - minV) / range);
    return { x, y, label: d.label, value: d.value };
  });
  const pathD = points.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  // smooth curve
  const smoothPath = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[idx - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX} ${prev.y}, ${midX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, "");

  const circles = points.map((pt) => `<circle cx="${pt.x}" cy="${pt.y}" r="7" fill="${COLOR.accent}" />`).join("");
  const labels = points
    .map((pt) => `<text x="${pt.x}" y="${h - 15}" class="chart-label">${escapeHtml(pt.label)}</text>`)
    .join("");
  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((t) => {
      const y = padT + (h - padT - padB) * (1 - t);
      const v = Math.round(minV + range * t);
      return `<line x1="${padL}" y1="${y}" x2="${w - padR}" y2="${y}" class="chart-grid"/>
              <text x="${padL - 12}" y="${y + 4}" class="chart-tick">${v}</text>`;
    })
    .join("");

  return `<section class="slide slide-line">
    <h1 class="section-title small">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="line-body">${escapeHtml(s.body)}</p>` : ""}
    <svg class="chart-line" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
      ${yTicks}
      <path d="${smoothPath}" fill="none" stroke="${COLOR.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}
      ${labels}
    </svg>
    <!-- pathD available for non-smooth fallback: ${pathD.substring(0, 1)} -->
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderQuote(s: SlideQuote, i: number, total: number, p: Presentation): string {
  return `<section class="slide slide-quote">
    ${multiGradientBackground("section")}
    <blockquote class="big-quote">« ${escapeHtml(s.quote)} »</blockquote>
    ${s.attribution ? `<div class="attribution">— ${escapeHtml(s.attribution)}</div>` : ""}
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderThanks(s: SlideThanks, i: number, total: number, p: Presentation): string {
  const title = s.title ?? "merci";
  const resources = s.resources ?? [];
  // Deux modes :
  //  • court (≤ 14 chars + ≤ 2 resources) → hero "merci" classique 180-240px
  //  • long (titre long OU 3+ resources) → mode "annexe" sobre : titre taille section,
  //    body normal, resources listées à taille lisible qui ne déborde pas.
  const isAnnexe = title.length > 14 || resources.length > 2;
  if (isAnnexe) {
    // Auto-size resources pour ne pas déborder : plus il y en a, plus c'est compact.
    const resSize = resources.length > 8 ? 16 : resources.length > 5 ? 18 : 20;
    const titleSize = Math.min(calcSectionSize(title), 110);
    return `<section class="slide slide-thanks slide-thanks-annexe">
      ${multiGradientBackground("section")}
      <h1 class="section-title small" style="font-size:${titleSize}px">${escapeHtml(title)}</h1>
      ${s.body ? `<p class="annexe-body">${escapeHtml(s.body)}</p>` : ""}
      ${resources.length ? `<ul class="annexe-resources" style="font-size:${resSize}px">${resources.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>` : ""}
      ${renderFooter(i, total, p)}
    </section>`;
  }
  // Mode court : hero "merci" original, mais avec auto-size anti-débordement.
  const heroSize = calcHeroSize(title);
  return `<section class="slide slide-thanks">
    ${multiGradientBackground("title")}
    <h1 class="title-hero thanks" style="font-size:${Math.min(heroSize, 240)}px">${escapeHtml(title)}</h1>
    ${s.body ? `<p class="thanks-body">${escapeHtml(s.body)}</p>` : ""}
    ${resources.length ? `<div class="thanks-resources">${resources.map((r) => `<div>${escapeHtml(r)}</div>`).join("")}</div>` : ""}
    ${renderFooter(i, total, p)}
  </section>`;
}

// ---- Schémas : Matrix / ValueChain / OrgChart (type "Miro") ----

function renderMatrix(s: SlideMatrix, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const W = 1400, H = 700;
  const padL = 180, padR = 60, padT = 60, padB = 120;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const midX = padL + plotW / 2;
  const midY = padT + plotH / 2;

  const toX = (x: number) => padL + Math.max(0, Math.min(1, x)) * plotW;
  const toY = (y: number) => padT + (1 - Math.max(0, Math.min(1, y))) * plotH;

  const quadLabels = s.quadrants ?? {};
  const quadBoxes = `
    <rect x="${padL}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.pink}" fill-opacity="0.08" stroke="none"/>
    <rect x="${midX}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.accent}" fill-opacity="0.12" stroke="none"/>
    <rect x="${padL}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.line}" fill-opacity="0.35" stroke="none"/>
    <rect x="${midX}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.accent2}" fill-opacity="0.10" stroke="none"/>
  `;

  const quadTexts = `
    ${quadLabels.tl ? `<text x="${padL + 20}" y="${padT + 34}" class="matrix-quad-label">${escapeHtml(quadLabels.tl)}</text>` : ""}
    ${quadLabels.tr ? `<text x="${W - padR - 20}" y="${padT + 34}" class="matrix-quad-label" text-anchor="end">${escapeHtml(quadLabels.tr)}</text>` : ""}
    ${quadLabels.bl ? `<text x="${padL + 20}" y="${H - padB - 18}" class="matrix-quad-label">${escapeHtml(quadLabels.bl)}</text>` : ""}
    ${quadLabels.br ? `<text x="${W - padR - 20}" y="${H - padB - 18}" class="matrix-quad-label" text-anchor="end">${escapeHtml(quadLabels.br)}</text>` : ""}
  `;

  const axes = `
    <line x1="${padL}" y1="${midY}" x2="${W - padR}" y2="${midY}" stroke="${COLOR.ink}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 6"/>
    <line x1="${midX}" y1="${padT}" x2="${midX}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 6"/>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-width="3"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-width="3"/>
  `;

  const axisLabels = `
    <text x="${padL - 14}" y="${padT + 8}" class="matrix-axis-tick" text-anchor="end">${escapeHtml(s.yAxis.high)}</text>
    <text x="${padL - 14}" y="${H - padB + 4}" class="matrix-axis-tick" text-anchor="end">${escapeHtml(s.yAxis.low)}</text>
    <text x="${padL - 110}" y="${midY}" class="matrix-axis-label" text-anchor="middle" transform="rotate(-90 ${padL - 110} ${midY})">${escapeHtml(s.yAxis.label)}</text>
    <text x="${padL}" y="${H - padB + 34}" class="matrix-axis-tick" text-anchor="start">${escapeHtml(s.xAxis.low)}</text>
    <text x="${W - padR}" y="${H - padB + 34}" class="matrix-axis-tick" text-anchor="end">${escapeHtml(s.xAxis.high)}</text>
    <text x="${midX}" y="${H - padB + 78}" class="matrix-axis-label" text-anchor="middle">${escapeHtml(s.xAxis.label)}</text>
  `;

  const points = s.points
    .map((pt) => {
      const cx = toX(pt.x);
      const cy = toY(pt.y);
      const fill = pt.highlight ? COLOR.accent : "#fff";
      const stroke = pt.highlight ? COLOR.accent : COLOR.ink;
      const labelColor = pt.highlight ? "#fff" : COLOR.ink;
      return `
        <g>
          <circle cx="${cx}" cy="${cy}" r="14" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
          <rect x="${cx + 22}" y="${cy - 20}" width="${Math.min(220, pt.label.length * 11 + 24)}" height="36" rx="18" fill="${pt.highlight ? COLOR.accent : "#fff"}" stroke="${COLOR.ink}" stroke-width="1.5"/>
          <text x="${cx + 34}" y="${cy + 4}" class="matrix-point-label" fill="${labelColor}">${escapeHtml(pt.label)}</text>
        </g>`;
    })
    .join("");

  return `<section class="slide slide-matrix">
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="matrix-body">${escapeHtml(s.body)}</p>` : ""}
    <svg class="matrix-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${quadBoxes}
      ${axes}
      ${quadTexts}
      ${axisLabels}
      ${points}
    </svg>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderValueChain(s: SlideValueChain, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const W = 1600, H = 620;
  const hubX = 290, hubY = H / 2;
  const hubW = 360, hubH = 200;
  const nodes = s.nodes.slice(0, 6);
  const n = nodes.length || 1;
  const rightX = 1100;
  const nodeW = 420, nodeH = 96;
  const gap = 14;
  const totalColH = n * nodeH + (n - 1) * gap;
  const topY = (H - totalColH) / 2;

  const hub = `
    <rect x="${hubX - hubW / 2}" y="${hubY - hubH / 2}" width="${hubW}" height="${hubH}" rx="24" fill="${COLOR.accent}" stroke="${COLOR.ink}" stroke-width="3"/>
    <text x="${hubX}" y="${hubY - (s.hub.caption ? 8 : -8)}" class="vc-hub-title" text-anchor="middle">${escapeHtml(s.hub.label)}</text>
    ${s.hub.caption ? `<text x="${hubX}" y="${hubY + 28}" class="vc-hub-caption" text-anchor="middle">${escapeHtml(s.hub.caption)}</text>` : ""}
  `;

  const nodeBoxes = nodes
    .map((node, idx) => {
      const ny = topY + idx * (nodeH + gap);
      const nCy = ny + nodeH / 2;
      // Courbe de Bézier depuis bord droit du hub vers bord gauche du node
      const sx = hubX + hubW / 2;
      const sy = hubY;
      const ex = rightX;
      const ey = nCy;
      const cx1 = sx + (ex - sx) * 0.55;
      return `
        <path d="M ${sx} ${sy} C ${cx1} ${sy}, ${cx1} ${ey}, ${ex} ${ey}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5" marker-end="url(#vc-arrow)"/>
        <rect x="${ex}" y="${ny}" width="${nodeW}" height="${nodeH}" rx="16" fill="#fff" stroke="${COLOR.ink}" stroke-width="2.5"/>
        <text x="${ex + 24}" y="${ny + (node.caption ? 38 : 56)}" class="vc-node-title">${escapeHtml(node.label)}</text>
        ${node.caption ? `<text x="${ex + 24}" y="${ny + 70}" class="vc-node-caption">${escapeHtml(node.caption)}</text>` : ""}
      `;
    })
    .join("");

  return `<section class="slide slide-valuechain">
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="vc-body">${escapeHtml(s.body)}</p>` : ""}
    <svg class="vc-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      <defs>
        <marker id="vc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="${COLOR.ink}"/>
        </marker>
      </defs>
      ${hub}
      ${nodeBoxes}
    </svg>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderOrgChart(s: SlideOrgChart, i: number, total: number, p: Presentation): string {
  const size = calcSectionSize(s.title);
  const W = 1600, H = 620;
  const rootW = 480, rootH = 180;
  const rootX = W / 2 - rootW / 2;
  const rootY = 30;
  const children = s.children.slice(0, 4);
  const n = children.length || 1;
  const childW = Math.min(380, (W - 80) / n - 40);
  const childH = 180;
  const gap = Math.max(40, (W - 80 - n * childW) / Math.max(1, n - 1));
  const totalRowW = n * childW + (n - 1) * gap;
  const startX = (W - totalRowW) / 2;
  const childY = H - childH - 40;
  const rootBottom = rootY + rootH;
  const busY = rootBottom + 60;

  const root = `
    <rect x="${rootX}" y="${rootY}" width="${rootW}" height="${rootH}" rx="24" fill="${COLOR.accent}" stroke="${COLOR.ink}" stroke-width="3"/>
    <text x="${rootX + rootW / 2}" y="${rootY + 58}" class="org-root-title" text-anchor="middle">${escapeHtml(s.root.label)}</text>
    ${s.root.role ? `<text x="${rootX + rootW / 2}" y="${rootY + 100}" class="org-root-role" text-anchor="middle">${escapeHtml(s.root.role)}</text>` : ""}
    ${s.root.caption ? `<text x="${rootX + rootW / 2}" y="${rootY + 138}" class="org-root-caption" text-anchor="middle">${escapeHtml(s.root.caption)}</text>` : ""}
  `;

  const trunk = `<line x1="${W / 2}" y1="${rootBottom}" x2="${W / 2}" y2="${busY}" stroke="${COLOR.ink}" stroke-width="3"/>`;

  const childBoxes = children
    .map((c, idx) => {
      const cx = startX + idx * (childW + gap);
      const ccx = cx + childW / 2;
      const connector = `
        <line x1="${ccx}" y1="${busY}" x2="${ccx}" y2="${childY}" stroke="${COLOR.ink}" stroke-width="3"/>
      `;
      const box = `
        <rect x="${cx}" y="${childY}" width="${childW}" height="${childH}" rx="20" fill="#fff" stroke="${COLOR.ink}" stroke-width="2.5"/>
        <text x="${ccx}" y="${childY + 54}" class="org-child-title" text-anchor="middle">${escapeHtml(c.label)}</text>
        ${c.role ? `<text x="${ccx}" y="${childY + 92}" class="org-child-role" text-anchor="middle">${escapeHtml(c.role)}</text>` : ""}
        ${c.caption ? `<text x="${ccx}" y="${childY + 128}" class="org-child-caption" text-anchor="middle">${escapeHtml(c.caption)}</text>` : ""}
      `;
      return connector + box;
    })
    .join("");

  const bus = n > 1
    ? `<line x1="${startX + childW / 2}" y1="${busY}" x2="${startX + totalRowW - childW / 2}" y2="${busY}" stroke="${COLOR.ink}" stroke-width="3"/>`
    : "";

  return `<section class="slide slide-orgchart">
    <h1 class="section-title small" style="font-size:${Math.min(size, 110)}px">${escapeHtml(s.title)}</h1>
    ${s.body ? `<p class="org-body">${escapeHtml(s.body)}</p>` : ""}
    <svg class="org-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
      ${root}
      ${trunk}
      ${bus}
      ${childBoxes}
    </svg>
    ${renderFooter(i, total, p)}
  </section>`;
}

function renderSlide(s: Slide, i: number, total: number, p: Presentation): string {
  switch (s.kind) {
    case "title": return renderTitle(s, i, total, p);
    case "toc": return renderToc(s, i, total, p);
    case "content": return renderContent(s, i, total, p);
    case "stat": return renderStat(s, i, total, p);
    case "bars": return renderBars(s, i, total, p);
    case "line": return renderLine(s, i, total, p);
    case "quote": return renderQuote(s, i, total, p);
    case "thanks": return renderThanks(s, i, total, p);
    case "compare": return renderCompare(s, i, total, p);
    case "flow": return renderFlow(s, i, total, p);
    case "pillars": return renderPillars(s, i, total, p);
    case "kpi": return renderKpi(s, i, total, p);
    case "matrix": return renderMatrix(s, i, total, p);
    case "valuechain": return renderValueChain(s, i, total, p);
    case "orgchart": return renderOrgChart(s, i, total, p);
  }
}

// ---- CSS template ----
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: ${COLOR.bg};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${COLOR.ink};
  -webkit-font-smoothing: antialiased;
}

.slide {
  position: relative;
  width: 1920px;
  height: 1080px;
  padding: 100px 120px 90px;
  background: ${COLOR.bg};
  overflow: hidden;
  page-break-after: always;
}

.slide:last-child { page-break-after: auto; }

.gradient-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: normal;
}

.footer {
  position: absolute;
  bottom: 50px;
  left: 120px;
  right: 120px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
  z-index: 10;
  color: ${COLOR.ink};
}

/* --- Title slide --- */
.slide-title { display: flex; flex-direction: column; justify-content: center; }
.title-category {
  position: absolute;
  top: 90px;
  left: 0; right: 0;
  text-align: center;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.18em;
  z-index: 5;
}
.title-hero {
  font-size: 260px;
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: -0.035em;
  position: relative;
  z-index: 5;
  max-width: 100%;
  text-align: center;
}
.title-hero.thanks { text-align: left; font-size: 240px; }
.title-subtitle {
  margin: 60px auto 0;
  max-width: 520px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.35;
  position: relative;
  z-index: 5;
  text-align: center;
}

/* --- TOC slide --- */
.slide-toc { padding-top: 130px; }
.toc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
  align-items: start;
}
.toc-col { display: flex; flex-direction: column; gap: 50px; }
.toc-item { display: flex; flex-direction: column; gap: 14px; }
.toc-num { font-size: 170px; font-weight: 900; line-height: 0.85; letter-spacing: -0.03em; }
.toc-label {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.1em;
  margin-top: -10px;
  margin-left: 14px;
}

/* --- Content slides --- */
.section-title {
  font-size: 180px;
  font-weight: 900;
  line-height: 0.88;
  letter-spacing: -0.035em;
  margin-bottom: 80px;
  position: relative;
  z-index: 5;
  max-width: 85%;
}
.section-title.small { font-size: 120px; margin-bottom: 60px; }
.content-body {
  max-width: 820px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  position: relative;
  z-index: 5;
}
.content-body p + p { margin-top: 28px; }
.content-body p { text-transform: uppercase; }

/* --- Stat slide --- */
.stat-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 40px;
  position: relative;
  z-index: 5;
}
.stat-value {
  font-size: 340px;
  font-weight: 900;
  line-height: 0.85;
  letter-spacing: -0.04em;
  color: ${COLOR.accent};
}
.stat-caption {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-left: 10px;
}
.stat-body {
  max-width: 700px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  position: relative;
  z-index: 5;
}

/* --- Bars chart --- */
.bars-wrap { display: grid; grid-template-columns: 1.1fr 1fr; gap: 80px; align-items: center; }
.bars { display: flex; flex-direction: column; gap: 28px; }
.bar-row { display: grid; grid-template-columns: 120px 1fr 80px; align-items: center; gap: 16px; }
.bar-label { font-size: 20px; font-weight: 800; }
.bar-track { position: relative; height: 48px; }
.bar-fill { position: absolute; top: 0; bottom: 0; border-radius: 4px; }
.bar-fill-light { background: ${COLOR.accent2}; z-index: 1; }
.bar-fill-dark { background: ${COLOR.accent}; z-index: 2; }
.bar-value { font-size: 22px; font-weight: 900; text-align: right; }
.bars-body { font-size: 22px; font-weight: 700; line-height: 1.4; letter-spacing: 0.02em; }
.bars-body p + p { margin-top: 22px; }

/* --- Line chart --- */
.chart-line { margin-top: 40px; }
.chart-label { font-size: 16px; font-weight: 700; fill: ${COLOR.ink}; text-anchor: middle; }
.chart-tick { font-size: 16px; font-weight: 700; fill: ${COLOR.ink}; text-anchor: end; }
.chart-grid { stroke: ${COLOR.ink}; stroke-opacity: 0.1; stroke-width: 1; }
.line-body { max-width: 820px; font-size: 22px; font-weight: 700; line-height: 1.35; margin-bottom: 30px; }

/* --- Quote --- */
.slide-quote { display: flex; flex-direction: column; justify-content: center; }
.big-quote {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.025em;
  max-width: 1400px;
  position: relative;
  z-index: 5;
}
.attribution {
  margin-top: 40px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  position: relative;
  z-index: 5;
}

/* --- Compare (Bad vs Good) --- */
.slide-compare { display: flex; flex-direction: column; }
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 50px;
  margin-top: 30px;
  position: relative;
  z-index: 5;
}
.compare-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 40px 32px;
  border-radius: 24px;
  min-height: 600px;
}
.compare-bad { background: rgba(255, 255, 255, 0.5); border: 2px solid ${COLOR.line}; }
.compare-good { background: #1e2957; color: #fff; }
.compare-col-head {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.02em;
  padding-bottom: 16px;
  border-bottom: 2px solid currentColor;
}
.compare-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 22px;
}
.compare-bad .compare-badge { background: rgba(0,0,0,0.08); color: ${COLOR.ink}; }
.compare-good .compare-badge { background: ${COLOR.accent}; color: #fff; }
.compare-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 14px; }
.compare-list li {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  padding-left: 28px;
  position: relative;
}
.compare-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 14px;
  width: 14px;
  height: 2px;
  background: currentColor;
  opacity: 0.5;
}

/* --- Flow (workflow steps avec flèches) --- */
.slide-flow { display: flex; flex-direction: column; }
.flow-body {
  max-width: 900px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
  margin-bottom: 40px;
  position: relative;
  z-index: 5;
}
.flow-row {
  display: flex;
  align-items: stretch;
  gap: 20px;
  flex-wrap: nowrap;
  justify-content: space-between;
  margin-top: 40px;
  position: relative;
  z-index: 5;
}
.flow-item {
  flex: 1;
  min-width: 0;
  padding: 36px 28px;
  background: #fff;
  border-radius: 24px;
  border: 2px solid ${COLOR.ink};
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.flow-num {
  font-size: 56px;
  font-weight: 900;
  line-height: 1;
  color: ${COLOR.accent};
  letter-spacing: -0.03em;
}
.flow-label {
  font-size: 28px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: ${COLOR.ink};
}
.flow-caption {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.45;
  color: ${COLOR.ink};
  opacity: 0.7;
}
.flow-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 900;
  color: ${COLOR.accent};
  padding: 0 4px;
}

/* --- Pillars (3-4 colonnes de concepts) --- */
.slide-pillars { display: flex; flex-direction: column; }
.pillars-grid {
  display: grid;
  gap: 32px;
  margin-top: 40px;
  position: relative;
  z-index: 5;
}
.pillars-grid[data-cols="3"] { grid-template-columns: 1fr 1fr 1fr; }
.pillars-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
.pillars-grid[data-cols="2"] { grid-template-columns: 1fr 1fr; }
.pillars-grid[data-cols="5"], .pillars-grid[data-cols="6"] { grid-template-columns: repeat(3, 1fr); }
.pillar {
  background: rgba(255, 255, 255, 0.7);
  padding: 32px 28px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 4px solid ${COLOR.accent};
  min-height: 280px;
}
.pillar-num {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.1em;
  color: ${COLOR.accent};
}
.pillar-title {
  font-size: 32px;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: -0.02em;
  color: ${COLOR.ink};
}
.pillar-desc {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.45;
  color: ${COLOR.ink};
  opacity: 0.85;
}

/* --- KPI grid --- */
.slide-kpi { display: flex; flex-direction: column; }
.kpi-body {
  max-width: 1100px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
  margin-bottom: 30px;
  position: relative;
  z-index: 5;
}
.kpi-grid {
  display: grid;
  gap: 28px;
  margin-top: 30px;
  position: relative;
  z-index: 5;
}
.kpi-grid[data-cols="2"] { grid-template-columns: 1fr 1fr; }
.kpi-grid[data-cols="3"] { grid-template-columns: 1fr 1fr 1fr; }
.kpi-grid[data-cols="4"] { grid-template-columns: repeat(4, 1fr); }
.kpi-card {
  background: #fff;
  padding: 40px 32px;
  border-radius: 24px;
  border: 2px solid ${COLOR.ink};
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 320px;
  position: relative;
}
.kpi-value {
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.035em;
  color: ${COLOR.ink};
}
.kpi-label {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${COLOR.ink};
  opacity: 0.75;
}
.kpi-delta {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.02em;
  align-self: flex-start;
}
.kpi-delta-icon { font-size: 14px; line-height: 1; }
.kpi-delta-up { background: #E4F5E9; color: #0A6F2D; }
.kpi-delta-down { background: #FBE4E4; color: #9A1B1B; }
.kpi-delta-flat { background: #F0EFEC; color: ${COLOR.ink}; }

/* --- Matrix 2×2 (positionnement / risques impact × probabilité) --- */
.slide-matrix { display: flex; flex-direction: column; }
.matrix-body {
  max-width: 1200px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 24px;
  position: relative;
  z-index: 5;
}
.matrix-svg { margin: 0 auto; display: block; max-width: 100%; height: auto; position: relative; z-index: 5; }
.matrix-quad-label {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  fill: ${COLOR.ink};
  opacity: 0.55;
}
.matrix-axis-label {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: ${COLOR.ink};
}
.matrix-axis-tick {
  font-size: 18px;
  font-weight: 700;
  fill: ${COLOR.ink};
  opacity: 0.7;
}
.matrix-point-label {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.01em;
  dominant-baseline: middle;
}

/* --- Value chain (hub → nœuds) --- */
.slide-valuechain { display: flex; flex-direction: column; }
.vc-body {
  max-width: 1200px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 24px;
  position: relative;
  z-index: 5;
}
.vc-svg { margin: 0 auto; display: block; max-width: 100%; height: auto; position: relative; z-index: 5; }
.vc-hub-title {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -0.02em;
  fill: #fff;
}
.vc-hub-caption {
  font-size: 18px;
  font-weight: 600;
  fill: #fff;
  opacity: 0.9;
}
.vc-node-title {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: -0.01em;
  fill: ${COLOR.ink};
}
.vc-node-caption {
  font-size: 17px;
  font-weight: 500;
  fill: ${COLOR.ink};
  opacity: 0.75;
}

/* --- Org chart (succession / hiérarchie) --- */
.slide-orgchart { display: flex; flex-direction: column; }
.org-body {
  max-width: 1200px;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 24px;
  position: relative;
  z-index: 5;
}
.org-svg { margin: 0 auto; display: block; max-width: 100%; height: auto; position: relative; z-index: 5; }
.org-root-title {
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.02em;
  fill: #fff;
}
.org-root-role {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: #fff;
  opacity: 0.9;
}
.org-root-caption {
  font-size: 17px;
  font-weight: 500;
  fill: #fff;
  opacity: 0.85;
}
.org-child-title {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.02em;
  fill: ${COLOR.ink};
}
.org-child-role {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: ${COLOR.accent};
}
.org-child-caption {
  font-size: 16px;
  font-weight: 500;
  fill: ${COLOR.ink};
  opacity: 0.75;
}

/* --- Thanks --- */
.slide-thanks { display: flex; flex-direction: column; justify-content: center; }
.slide-thanks.slide-thanks-annexe {
  justify-content: flex-start;
  padding-top: 100px;
}
.annexe-body {
  max-width: 1200px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.02em;
  margin-bottom: 40px;
  position: relative;
  z-index: 5;
}
.annexe-resources {
  list-style: none;
  padding: 0;
  margin: 0;
  max-width: 1500px;
  max-height: 620px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  z-index: 5;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.01em;
}
.annexe-resources li {
  padding-left: 24px;
  position: relative;
  color: ${COLOR.ink};
}
.annexe-resources li::before {
  content: "—";
  position: absolute;
  left: 0;
  top: 0;
  color: ${COLOR.accent};
  font-weight: 900;
}
.thanks-body {
  max-width: 720px;
  margin-top: 40px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  position: relative;
  z-index: 5;
}
.thanks-resources {
  margin-top: 80px;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  position: relative;
  z-index: 5;
}
.thanks-resources div { line-height: 1.8; }
`;

export function renderPresentationHTML(p: Presentation): string {
  const total = p.slides.length;
  const slidesHtml = p.slides.map((s, i) => renderSlide(s, i, total, p)).join("\n");
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(p.title)}</title>
  <style>${STYLES}</style>
</head>
<body>
${slidesHtml}
</body>
</html>`;
}
