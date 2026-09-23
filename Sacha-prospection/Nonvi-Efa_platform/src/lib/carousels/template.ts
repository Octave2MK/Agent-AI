/**
 * Template carrousel — STYLE ÉDITORIAL MAGAZINE (référence : IMG_5521→5525).
 *
 * Caractéristiques visuelles (matched to reference):
 * - Fond crème #F5F0E8 avec quadrillage papier millimétré très subtil
 * - Typographie serif massive (Playfair Display 900) pour les gros titres
 * - Accents italiques terracotta #C94F3C pour 1-2 mots d'emphase par slide
 * - Soulignements main-levée (double ou simple) sous les mots-clés de titre
 * - Sous-texte gris (#6B6B6B) en sans-serif
 * - Header top-left : cercle terracotta + astérisque blanc + "Nonvi-Efa" en serif
 * - Header top-right : pill sombre arrondie avec "1/5"
 * - Footer : @Nonvi-Efaagency en terracotta letterspacé
 *
 * Texte rendu via Puppeteer → 100 % fidèle au markdown (aucune hallucination).
 */

import type { Slide, Presentation } from "../presentations/template";

export type CarouselRatio = "1:1" | "4:5" | "9:16";

const DIMENSIONS: Record<CarouselRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
};

const COLOR = {
  bg: "#F5F0E8",
  grid: "#E4DFD5",
  ink: "#121212",
  subtle: "#6B6B6B",
  terracotta: "#C94F3C",
  terracottaSoft: "#E8B5A8",
  cardBg: "#FFFFFF",
  darkPill: "#2C2C2C",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Nettoie un body text destiné à être rendu comme paragraphes de slide :
 * retire les artefacts markdown qui seraient affichés littéralement
 * (séparateurs `---`, code fences, chevrons de citation, H1/H2 orphelins).
 */
function sanitizeBody(s: string): string {
  return s
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;
      if (/^-{3,}$/.test(t)) return false;           // séparateur horizontal
      if (/^(```|~~~)/.test(t)) return false;        // code fence
      if (/^#{1,6}\s/.test(t)) return false;         // titres orphelins
      return true;
    })
    .map((line) => line.replace(/^\s*>\s?/, "").replace(/^\s*[-*•]\s*/, "• "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Applique l'emphase éditoriale : les mots entre `*...*` deviennent italique
 * terracotta ; les mots entre `_..._` sont soulignés main-levée. Le reste est
 * rendu en black serif. On opère APRÈS le escapeHtml.
 */
function editorialInline(s: string): string {
  const escaped = escapeHtml(s);
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<em class="accent">$1</em>')
    .replace(/_([^_\n]+)_/g, '<span class="underline-hand">$1</span>');
}

function pageIndicator(index: number, total: number): string {
  return `<div class="page-pill">${String(index + 1)}/${total}</div>`;
}

function brandHeader(variant: "compact" | "centered" = "compact"): string {
  if (variant === "centered") {
    return `<div class="brand-centered">
      <span class="brand-dot">✳</span>
      <span class="brand-name">Nonvi-Efa</span>
    </div>`;
  }
  return `<div class="brand-compact">
    <span class="brand-dot">✳</span>
    <span class="brand-name">Nonvi-Efa</span>
  </div>`;
}

function handleFooter(): string {
  return `<div class="handle-footer">@Nonvi-Efaagency</div>`;
}

// --- Renderers par type de slide ---

function rTitle(s: Extract<Slide, { kind: "title" }>, index: number, total: number): string {
  return `<section class="slide slide-hero">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="hero-body">
      ${s.category ? `<div class="hero-label">${escapeHtml(s.category)}</div>` : ""}
      <h1 class="hero-title">${editorialInline(s.title)}</h1>
      ${s.subtitle ? `<p class="hero-sub">${escapeHtml(s.subtitle)}</p>` : ""}
    </div>
    ${handleFooter()}
  </section>`;
}

function rContent(s: Extract<Slide, { kind: "content" }>, index: number, total: number): string {
  const cleaned = sanitizeBody(s.body);
  const paragraphs = cleaned
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) => `<p>${editorialInline(p.trim())}</p>`)
    .join("");
  return `<section class="slide slide-body">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="body-content">
      <h1 class="body-title"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      <div class="body-text">${paragraphs}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rStat(s: Extract<Slide, { kind: "stat" }>, index: number, total: number): string {
  const body = s.body ? sanitizeBody(s.body) : "";
  return `<section class="slide slide-stat">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="stat-wrap">
      <h1 class="body-title"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      <div class="stat-big">${escapeHtml(s.bigValue)}</div>
      <div class="stat-caption">${escapeHtml(s.caption)}</div>
      ${body ? `<p class="stat-body">${editorialInline(body)}</p>` : ""}
    </div>
    ${handleFooter()}
  </section>`;
}

function rQuote(s: Extract<Slide, { kind: "quote" }>, index: number, total: number): string {
  return `<section class="slide slide-quote">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="quote-wrap">
      <div class="quote-mark">"</div>
      <blockquote class="big-quote">${editorialInline(s.quote)}</blockquote>
      ${s.attribution ? `<div class="quote-attr">— ${escapeHtml(s.attribution)}</div>` : ""}
    </div>
    ${handleFooter()}
  </section>`;
}

function rCompare(s: Extract<Slide, { kind: "compare" }>, index: number, total: number): string {
  const col = (label: string, items: string[], variant: "bad" | "good") => {
    const icon = variant === "bad" ? "×" : "✓";
    const cards = items
      .map((it) => `<div class="compare-bubble ${variant}"><p>${editorialInline(it)}</p></div>`)
      .join("");
    return `<div class="compare-col">
      <div class="compare-col-head ${variant}">
        <span class="compare-icon">${icon}</span>
        <span>${escapeHtml(label)}</span>
      </div>
      ${cards}
    </div>`;
  };
  return `<section class="slide slide-compare">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="compare-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      <div class="compare-grid">
        ${col(s.leftLabel, s.leftItems, "bad")}
        ${col(s.rightLabel, s.rightItems, "good")}
      </div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rFlow(s: Extract<Slide, { kind: "flow" }>, index: number, total: number): string {
  const letters = ["R", "G", "C", "T", "A", "S"];
  const items = s.steps.map((step, idx) => `
    <div class="flow-line">
      <span class="flow-letter">${letters[idx] ?? String(idx + 1)}</span>
      <div class="flow-text">
        <strong>${escapeHtml(step.label)}</strong>${step.caption ? ` — <span class="flow-caption">${editorialInline(step.caption)}</span>` : ""}
      </div>
    </div>`).join("");
  return `<section class="slide slide-flow">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="flow-wrap">
      <h1 class="body-title"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${s.body ? `<p class="body-text-sub">${editorialInline(s.body)}</p>` : ""}
      <div class="flow-list">${items}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rPillars(s: Extract<Slide, { kind: "pillars" }>, index: number, total: number): string {
  const items = s.pillars.map((p) => `
    <div class="pillar-line">
      <div class="pillar-title">${editorialInline(p.title)}</div>
      <div class="pillar-desc">${editorialInline(p.description)}</div>
    </div>`).join("");
  return `<section class="slide slide-pillars">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="pillars-wrap">
      <h1 class="body-title"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      <div class="pillars-list">${items}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rKpi(s: Extract<Slide, { kind: "kpi" }>, index: number, total: number): string {
  const cards = s.cards.slice(0, 4).map((c) => {
    const deltaClass = c.deltaKind === "down" ? "kpi-delta-down" : c.deltaKind === "flat" ? "kpi-delta-flat" : "kpi-delta-up";
    return `<div class="kpi-block">
      <div class="kpi-big">${escapeHtml(c.value)}</div>
      <div class="kpi-lab">${escapeHtml(c.label)}</div>
      ${c.delta ? `<div class="kpi-delta ${deltaClass}">${escapeHtml(c.delta)}</div>` : ""}
    </div>`;
  }).join("");
  return `<section class="slide slide-kpi">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="kpi-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${s.body ? `<p class="body-text-sub">${editorialInline(s.body)}</p>` : ""}
      <div class="kpi-grid" data-cols="${Math.min(s.cards.length, 4)}">${cards}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rBars(s: Extract<Slide, { kind: "bars" }>, index: number, total: number): string {
  const max = Math.max(...s.data.map((d) => d.value), 1);
  const bars = s.data.map((d) => `
    <div class="bar-line">
      <div class="bar-label">${escapeHtml(d.label)}</div>
      <div class="bar-track-wrap">
        <div class="bar-fill" style="width:${(d.value / max) * 100}%"></div>
      </div>
      <div class="bar-val">${d.value}</div>
    </div>`).join("");
  return `<section class="slide slide-bars">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="bars-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${s.body ? `<p class="body-text-sub">${editorialInline(s.body)}</p>` : ""}
      <div class="bars-list">${bars}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rThanks(s: Extract<Slide, { kind: "thanks" }>, index: number, total: number): string {
  const lines = s.title ? s.title.split(/\n/) : ["Prochaine étape"];
  const body = s.body ? sanitizeBody(s.body) : "";
  return `<section class="slide slide-cta">
    ${brandHeader("centered")}
    ${pageIndicator(index, total)}
    <div class="cta-wrap">
      <h1 class="cta-title">${editorialInline(lines.join(" "))}</h1>
      ${body ? `<p class="cta-sub">${editorialInline(body)}</p>` : ""}
      ${s.resources?.length ? `<div class="cta-resources">${s.resources.map((r) => `<div class="cta-resource">${escapeHtml(r)}</div>`).join("")}</div>` : ""}
    </div>
    ${handleFooter()}
  </section>`;
}

function rToc(s: Extract<Slide, { kind: "toc" }>, index: number, total: number): string {
  const items = s.items.slice(0, 8).map((it) => `
    <div class="toc-item">
      <span class="toc-num">${escapeHtml(it.num)}</span>
      <span class="toc-lab">${escapeHtml(it.label)}</span>
    </div>`).join("");
  return `<section class="slide slide-toc">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="toc-wrap">
      <h1 class="body-title"><span class="underline-hand">Sommaire</span></h1>
      <div class="toc-list">${items}</div>
    </div>
    ${handleFooter()}
  </section>`;
}

function rLine(s: Extract<Slide, { kind: "line" }>, index: number, total: number): string {
  // En carrousel, la courbe temporelle devient un simple [bars]
  return rBars({ kind: "bars", title: s.title, body: s.body, data: s.data }, index, total);
}

// --- Schémas style Miro (adaptés au carré carrousel) ---

function rMatrix(s: Extract<Slide, { kind: "matrix" }>, index: number, total: number): string {
  const W = 900, H = 680;
  const padL = 120, padR = 40, padT = 30, padB = 90;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const midX = padL + plotW / 2;
  const midY = padT + plotH / 2;
  const toX = (x: number) => padL + Math.max(0, Math.min(1, x)) * plotW;
  const toY = (y: number) => padT + (1 - Math.max(0, Math.min(1, y))) * plotH;
  const q = s.quadrants ?? {};
  const quadBoxes = `
    <rect x="${padL}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.terracottaSoft}" fill-opacity="0.30"/>
    <rect x="${midX}" y="${padT}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.terracotta}" fill-opacity="0.15"/>
    <rect x="${padL}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.grid}" fill-opacity="0.40"/>
    <rect x="${midX}" y="${midY}" width="${plotW / 2}" height="${plotH / 2}" fill="${COLOR.terracottaSoft}" fill-opacity="0.15"/>
  `;
  const axes = `
    <line x1="${padL}" y1="${midY}" x2="${W - padR}" y2="${midY}" stroke="${COLOR.ink}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 6"/>
    <line x1="${midX}" y1="${padT}" x2="${midX}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="6 6"/>
    <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-width="3"/>
    <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="${COLOR.ink}" stroke-width="3"/>
  `;
  const quadTexts = `
    ${q.tl ? `<text x="${padL + 16}" y="${padT + 28}" class="mx-quad">${escapeHtml(q.tl)}</text>` : ""}
    ${q.tr ? `<text x="${W - padR - 16}" y="${padT + 28}" class="mx-quad" text-anchor="end">${escapeHtml(q.tr)}</text>` : ""}
    ${q.bl ? `<text x="${padL + 16}" y="${H - padB - 14}" class="mx-quad">${escapeHtml(q.bl)}</text>` : ""}
    ${q.br ? `<text x="${W - padR - 16}" y="${H - padB - 14}" class="mx-quad" text-anchor="end">${escapeHtml(q.br)}</text>` : ""}
  `;
  const axisLabels = `
    <text x="${padL - 10}" y="${padT + 6}" class="mx-tick" text-anchor="end">${escapeHtml(s.yAxis.high)}</text>
    <text x="${padL - 10}" y="${H - padB + 4}" class="mx-tick" text-anchor="end">${escapeHtml(s.yAxis.low)}</text>
    <text x="${padL - 80}" y="${midY}" class="mx-axis" text-anchor="middle" transform="rotate(-90 ${padL - 80} ${midY})">${escapeHtml(s.yAxis.label)}</text>
    <text x="${padL}" y="${H - padB + 28}" class="mx-tick">${escapeHtml(s.xAxis.low)}</text>
    <text x="${W - padR}" y="${H - padB + 28}" class="mx-tick" text-anchor="end">${escapeHtml(s.xAxis.high)}</text>
    <text x="${midX}" y="${H - padB + 64}" class="mx-axis" text-anchor="middle">${escapeHtml(s.xAxis.label)}</text>
  `;
  const points = s.points
    .map((pt) => {
      const cx = toX(pt.x);
      const cy = toY(pt.y);
      const fill = pt.highlight ? COLOR.terracotta : "#fff";
      const stroke = pt.highlight ? COLOR.terracotta : COLOR.ink;
      const txtColor = pt.highlight ? "#fff" : COLOR.ink;
      const labelW = Math.min(220, pt.label.length * 11 + 24);
      return `<g>
        <circle cx="${cx}" cy="${cy}" r="12" fill="${fill}" stroke="${stroke}" stroke-width="3"/>
        <rect x="${cx + 18}" y="${cy - 18}" width="${labelW}" height="32" rx="16" fill="${pt.highlight ? COLOR.terracotta : "#fff"}" stroke="${COLOR.ink}" stroke-width="1.5"/>
        <text x="${cx + 30}" y="${cy + 3}" class="mx-label" fill="${txtColor}">${escapeHtml(pt.label)}</text>
      </g>`;
    })
    .join("");
  const body = s.body ? sanitizeBody(s.body) : "";
  return `<section class="slide slide-matrix">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="matrix-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${body ? `<p class="body-text-sub">${editorialInline(body)}</p>` : ""}
      <svg class="matrix-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        ${quadBoxes}
        ${axes}
        ${quadTexts}
        ${axisLabels}
        ${points}
      </svg>
    </div>
    ${handleFooter()}
  </section>`;
}

function rValueChain(s: Extract<Slide, { kind: "valuechain" }>, index: number, total: number): string {
  const W = 900, H = 680;
  const hubX = 230, hubY = H / 2;
  const hubW = 300, hubH = 170;
  const nodes = s.nodes.slice(0, 5);
  const n = nodes.length || 1;
  const rightX = 600;
  const nodeW = 260, nodeH = 86;
  const gap = 16;
  const totalColH = n * nodeH + (n - 1) * gap;
  const topY = (H - totalColH) / 2;
  const hub = `
    <rect x="${hubX - hubW / 2}" y="${hubY - hubH / 2}" width="${hubW}" height="${hubH}" rx="22" fill="${COLOR.terracotta}" stroke="${COLOR.ink}" stroke-width="3"/>
    <text x="${hubX}" y="${hubY - (s.hub.caption ? 6 : -8)}" class="vc-hub-t" text-anchor="middle">${escapeHtml(s.hub.label)}</text>
    ${s.hub.caption ? `<text x="${hubX}" y="${hubY + 24}" class="vc-hub-c" text-anchor="middle">${escapeHtml(s.hub.caption)}</text>` : ""}
  `;
  const nodeBoxes = nodes
    .map((node, idx) => {
      const ny = topY + idx * (nodeH + gap);
      const nCy = ny + nodeH / 2;
      const sx = hubX + hubW / 2;
      const sy = hubY;
      const ex = rightX;
      const ey = nCy;
      const cx1 = sx + (ex - sx) * 0.55;
      return `
        <path d="M ${sx} ${sy} C ${cx1} ${sy}, ${cx1} ${ey}, ${ex} ${ey}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5" marker-end="url(#vc-arrow-c)"/>
        <rect x="${ex}" y="${ny}" width="${nodeW}" height="${nodeH}" rx="14" fill="#fff" stroke="${COLOR.ink}" stroke-width="2.5"/>
        <text x="${ex + 18}" y="${ny + (node.caption ? 34 : 52)}" class="vc-node-t">${escapeHtml(node.label)}</text>
        ${node.caption ? `<text x="${ex + 18}" y="${ny + 60}" class="vc-node-c">${escapeHtml(node.caption)}</text>` : ""}
      `;
    })
    .join("");
  const body = s.body ? sanitizeBody(s.body) : "";
  return `<section class="slide slide-valuechain">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="vc-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${body ? `<p class="body-text-sub">${editorialInline(body)}</p>` : ""}
      <svg class="vc-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="vc-arrow-c" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="${COLOR.ink}"/>
          </marker>
        </defs>
        ${hub}
        ${nodeBoxes}
      </svg>
    </div>
    ${handleFooter()}
  </section>`;
}

function rOrgChart(s: Extract<Slide, { kind: "orgchart" }>, index: number, total: number): string {
  const W = 900, H = 680;
  const rootW = 360, rootH = 150;
  const rootX = W / 2 - rootW / 2;
  const rootY = 30;
  const children = s.children.slice(0, 3);
  const n = children.length || 1;
  const childW = Math.min(260, (W - 60) / n - 30);
  const childH = 150;
  const gap = Math.max(30, (W - 60 - n * childW) / Math.max(1, n - 1));
  const totalRowW = n * childW + (n - 1) * gap;
  const startX = (W - totalRowW) / 2;
  const childY = H - childH - 40;
  const rootBottom = rootY + rootH;
  const busY = rootBottom + 50;
  const root = `
    <rect x="${rootX}" y="${rootY}" width="${rootW}" height="${rootH}" rx="22" fill="${COLOR.terracotta}" stroke="${COLOR.ink}" stroke-width="3"/>
    <text x="${rootX + rootW / 2}" y="${rootY + 50}" class="org-root-t" text-anchor="middle">${escapeHtml(s.root.label)}</text>
    ${s.root.role ? `<text x="${rootX + rootW / 2}" y="${rootY + 86}" class="org-root-r" text-anchor="middle">${escapeHtml(s.root.role)}</text>` : ""}
    ${s.root.caption ? `<text x="${rootX + rootW / 2}" y="${rootY + 118}" class="org-root-c" text-anchor="middle">${escapeHtml(s.root.caption)}</text>` : ""}
  `;
  const trunk = `<line x1="${W / 2}" y1="${rootBottom}" x2="${W / 2}" y2="${busY}" stroke="${COLOR.ink}" stroke-width="3"/>`;
  const childBoxes = children
    .map((c, idx) => {
      const cx = startX + idx * (childW + gap);
      const ccx = cx + childW / 2;
      const connector = `<line x1="${ccx}" y1="${busY}" x2="${ccx}" y2="${childY}" stroke="${COLOR.ink}" stroke-width="3"/>`;
      const box = `
        <rect x="${cx}" y="${childY}" width="${childW}" height="${childH}" rx="18" fill="#fff" stroke="${COLOR.ink}" stroke-width="2.5"/>
        <text x="${ccx}" y="${childY + 46}" class="org-child-t" text-anchor="middle">${escapeHtml(c.label)}</text>
        ${c.role ? `<text x="${ccx}" y="${childY + 78}" class="org-child-r" text-anchor="middle">${escapeHtml(c.role)}</text>` : ""}
        ${c.caption ? `<text x="${ccx}" y="${childY + 110}" class="org-child-c" text-anchor="middle">${escapeHtml(c.caption)}</text>` : ""}
      `;
      return connector + box;
    })
    .join("");
  const bus = n > 1
    ? `<line x1="${startX + childW / 2}" y1="${busY}" x2="${startX + totalRowW - childW / 2}" y2="${busY}" stroke="${COLOR.ink}" stroke-width="3"/>`
    : "";
  const body = s.body ? sanitizeBody(s.body) : "";
  return `<section class="slide slide-orgchart">
    ${brandHeader()}
    ${pageIndicator(index, total)}
    <div class="org-wrap">
      <h1 class="body-title small"><span class="underline-hand">${editorialInline(s.title)}</span></h1>
      ${body ? `<p class="body-text-sub">${editorialInline(body)}</p>` : ""}
      <svg class="org-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        ${root}
        ${trunk}
        ${bus}
        ${childBoxes}
      </svg>
    </div>
    ${handleFooter()}
  </section>`;
}

function renderSlide(s: Slide, index: number, total: number): string {
  switch (s.kind) {
    case "title": return rTitle(s, index, total);
    case "content": return rContent(s, index, total);
    case "stat": return rStat(s, index, total);
    case "quote": return rQuote(s, index, total);
    case "thanks": return rThanks(s, index, total);
    case "compare": return rCompare(s, index, total);
    case "flow": return rFlow(s, index, total);
    case "pillars": return rPillars(s, index, total);
    case "kpi": return rKpi(s, index, total);
    case "bars": return rBars(s, index, total);
    case "toc": return rToc(s, index, total);
    case "line": return rLine(s, index, total);
    case "matrix": return rMatrix(s, index, total);
    case "valuechain": return rValueChain(s, index, total);
    case "orgchart": return rOrgChart(s, index, total);
  }
}

function styles(ratio: CarouselRatio): string {
  const dim = DIMENSIONS[ratio];
  return `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Inter:wght@400;500;600;700;800&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: ${COLOR.bg};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${COLOR.ink};
  -webkit-font-smoothing: antialiased;
}

.slide {
  position: relative;
  width: ${dim.width}px;
  height: ${dim.height}px;
  padding: 72px 72px 90px;
  background: ${COLOR.bg};
  background-image:
    linear-gradient(${COLOR.grid} 1px, transparent 1px),
    linear-gradient(90deg, ${COLOR.grid} 1px, transparent 1px);
  background-size: 72px 72px;
  background-position: 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* === Header / Brand === */
.brand-compact {
  position: absolute;
  top: 48px;
  left: 56px;
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 10;
}
.brand-centered {
  display: flex;
  align-items: center;
  gap: 14px;
  justify-content: center;
  margin-bottom: 40px;
  z-index: 5;
}
.brand-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${COLOR.terracotta};
  color: white;
  font-size: 28px;
  font-weight: 900;
  box-shadow: 0 0 0 8px ${COLOR.terracottaSoft}40;
}
.brand-name {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 36px;
  font-weight: 900;
  color: ${COLOR.ink};
  letter-spacing: -0.01em;
}

/* === Page indicator === */
.page-pill {
  position: absolute;
  top: 48px;
  right: 56px;
  background: ${COLOR.darkPill};
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 8px 20px;
  border-radius: 999px;
  z-index: 10;
}

/* === Handle footer === */
.handle-footer {
  position: absolute;
  bottom: 36px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${COLOR.terracotta};
  letter-spacing: 0.04em;
  z-index: 10;
}

/* === Emphasis inline === */
.accent {
  font-family: 'Playfair Display', Georgia, serif;
  font-style: italic;
  color: ${COLOR.terracotta};
  font-weight: 900;
}
.underline-hand {
  display: inline;
  background-image: linear-gradient(${COLOR.ink}, ${COLOR.ink});
  background-repeat: no-repeat;
  background-size: 100% 4px;
  background-position: 0 96%;
  padding-bottom: 2px;
}

/* === HERO slide (cover) === */
.slide-hero { justify-content: center; }
.hero-body {
  max-width: 100%;
  margin-top: 60px;
  position: relative;
  z-index: 5;
}
.hero-label {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${COLOR.terracotta};
  margin-bottom: 28px;
}
.hero-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 140px;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.025em;
  color: ${COLOR.ink};
}
.hero-title .accent {
  font-size: 0.95em;
}
.hero-sub {
  margin-top: 32px;
  max-width: 820px;
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 1.35;
  color: ${COLOR.subtle};
}

/* === BODY slide === */
.slide-body { justify-content: flex-start; }
.body-content {
  margin-top: 140px;
  max-width: 100%;
  position: relative;
  z-index: 5;
}
.body-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 86px;
  font-weight: 900;
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: ${COLOR.ink};
  text-transform: none;
  margin-bottom: 24px;
}
.body-title.small { font-size: 64px; }
.body-text {
  font-family: 'Inter', sans-serif;
  font-size: 40px;
  font-weight: 500;
  line-height: 1.4;
  color: ${COLOR.ink};
  max-width: 940px;
}
.body-text p + p { margin-top: 26px; }
.body-text-sub {
  font-family: 'Inter', sans-serif;
  font-size: 30px;
  font-weight: 500;
  line-height: 1.4;
  color: ${COLOR.subtle};
  margin-bottom: 40px;
  max-width: 940px;
}

/* === STAT slide === */
.slide-stat { justify-content: flex-start; }
.stat-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.stat-big {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 240px;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.04em;
  color: ${COLOR.terracotta};
  margin-top: 20px;
}
.stat-caption {
  font-family: 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${COLOR.ink};
  margin-top: 16px;
}
.stat-body {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.45;
  color: ${COLOR.subtle};
  margin-top: 20px;
  max-width: 800px;
}

/* === QUOTE slide === */
.slide-quote { justify-content: center; }
.quote-wrap {
  position: relative;
  z-index: 5;
  max-width: 100%;
}
.quote-mark {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 240px;
  font-weight: 900;
  color: ${COLOR.terracotta};
  line-height: 0.6;
  margin-bottom: 10px;
}
.big-quote {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 74px;
  font-weight: 700;
  font-style: italic;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: ${COLOR.ink};
  max-width: 100%;
}
.quote-attr {
  margin-top: 32px;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: ${COLOR.subtle};
  letter-spacing: 0.02em;
}

/* === COMPARE slide === */
.slide-compare { justify-content: flex-start; }
.compare-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  margin-top: 30px;
}
.compare-col { display: flex; flex-direction: column; gap: 18px; }
.compare-col-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${COLOR.subtle};
  margin-bottom: 6px;
}
.compare-col-head.good { color: ${COLOR.ink}; }
.compare-icon {
  font-size: 20px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 800;
}
.compare-bubble {
  padding: 22px 26px;
  border-radius: 22px;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.35;
}
.compare-bubble.bad {
  background: ${COLOR.cardBg};
  border: 1.5px solid ${COLOR.grid};
  color: ${COLOR.subtle};
  font-style: italic;
}
.compare-bubble.good {
  background: ${COLOR.ink};
  color: white;
  border: 1.5px solid ${COLOR.ink};
  font-style: italic;
}

/* === FLOW slide (liste avec lettres colorées) === */
.slide-flow { justify-content: flex-start; }
.flow-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.flow-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 36px;
}
.flow-line {
  display: flex;
  align-items: center;
  gap: 18px;
}
.flow-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: ${COLOR.ink};
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 900;
  flex-shrink: 0;
}
.flow-line:nth-child(2) .flow-letter { background: ${COLOR.terracotta}; }
.flow-text {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 500;
  line-height: 1.35;
  color: ${COLOR.ink};
}
.flow-text strong { font-weight: 800; }
.flow-caption { color: ${COLOR.subtle}; }

/* === PILLARS slide === */
.slide-pillars { justify-content: flex-start; }
.pillars-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.pillars-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-top: 36px;
}
.pillar-line {
  padding-left: 28px;
  border-left: 4px solid ${COLOR.terracotta};
}
.pillar-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 34px;
  font-weight: 900;
  line-height: 1.1;
  color: ${COLOR.ink};
  margin-bottom: 8px;
}
.pillar-desc {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 500;
  line-height: 1.4;
  color: ${COLOR.subtle};
}

/* === KPI slide === */
.slide-kpi { justify-content: flex-start; }
.kpi-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.kpi-grid {
  display: grid;
  gap: 20px;
  margin-top: 32px;
}
.kpi-grid[data-cols="2"], .kpi-grid[data-cols="3"], .kpi-grid[data-cols="4"] {
  grid-template-columns: 1fr 1fr;
}
.kpi-block {
  background: ${COLOR.cardBg};
  padding: 28px 26px;
  border-radius: 20px;
  border: 1.5px solid ${COLOR.grid};
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.kpi-big {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 80px;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.03em;
  color: ${COLOR.ink};
}
.kpi-lab {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${COLOR.subtle};
}
.kpi-delta {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 800;
  padding: 4px 12px;
  border-radius: 999px;
  align-self: flex-start;
}
.kpi-delta-up { background: #E4F5E9; color: #0A6F2D; }
.kpi-delta-down { background: #FBE4E4; color: #9A1B1B; }
.kpi-delta-flat { background: #EEEDE9; color: ${COLOR.ink}; }

/* === BARS slide === */
.slide-bars { justify-content: flex-start; }
.bars-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.bars-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 24px;
}
.bar-line {
  display: grid;
  grid-template-columns: 180px 1fr 80px;
  align-items: center;
  gap: 18px;
}
.bar-label {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: ${COLOR.ink};
}
.bar-track-wrap {
  height: 32px;
  background: ${COLOR.cardBg};
  border: 1.5px solid ${COLOR.grid};
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: ${COLOR.terracotta};
  border-radius: 999px;
}
.bar-val {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 22px;
  font-weight: 800;
  text-align: right;
  color: ${COLOR.ink};
}

/* === TOC slide === */
.slide-toc { justify-content: flex-start; }
.toc-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.toc-list {
  margin-top: 36px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.toc-item { display: flex; align-items: baseline; gap: 18px; }
.toc-num {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 36px;
  font-weight: 900;
  color: ${COLOR.terracotta};
  min-width: 60px;
}
.toc-lab {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: ${COLOR.ink};
  letter-spacing: 0.01em;
}

/* === CTA / Thanks slide === */
.slide-cta { justify-content: center; align-items: center; text-align: center; }
.cta-wrap {
  position: relative;
  z-index: 5;
  max-width: 100%;
}
.cta-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 100px;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  color: ${COLOR.ink};
  margin-bottom: 30px;
}
.cta-sub {
  font-family: 'Inter', sans-serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 1.4;
  color: ${COLOR.subtle};
  max-width: 760px;
  margin: 0 auto 40px;
}
.cta-resources {
  display: inline-flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px 48px;
  border: 2px solid ${COLOR.ink};
  border-radius: 999px;
  margin-top: 10px;
}
.cta-resource {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: ${COLOR.ink};
  text-transform: uppercase;
}

/* === Schémas Miro (matrix / valuechain / orgchart) === */
.slide-matrix, .slide-valuechain, .slide-orgchart { justify-content: flex-start; }
.matrix-wrap, .vc-wrap, .org-wrap {
  margin-top: 140px;
  position: relative;
  z-index: 5;
}
.matrix-svg, .vc-svg, .org-svg {
  width: 100%;
  max-width: 940px;
  height: auto;
  margin-top: 20px;
  display: block;
}
.mx-quad {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: ${COLOR.ink};
  opacity: 0.55;
}
.mx-axis {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  fill: ${COLOR.ink};
}
.mx-tick {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  fill: ${COLOR.ink};
  opacity: 0.7;
}
.mx-label {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 800;
  dominant-baseline: middle;
}
.vc-hub-t {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 28px;
  font-weight: 900;
  fill: #fff;
  letter-spacing: -0.01em;
}
.vc-hub-c {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  fill: #fff;
  opacity: 0.9;
}
.vc-node-t {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 900;
  fill: ${COLOR.ink};
}
.vc-node-c {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  fill: ${COLOR.ink};
  opacity: 0.7;
}
.org-root-t {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 30px;
  font-weight: 900;
  fill: #fff;
  letter-spacing: -0.01em;
}
.org-root-r {
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: #fff;
  opacity: 0.9;
}
.org-root-c {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  fill: #fff;
  opacity: 0.85;
}
.org-child-t {
  font-family: 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 900;
  fill: ${COLOR.ink};
  letter-spacing: -0.01em;
}
.org-child-r {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  fill: ${COLOR.terracotta};
}
.org-child-c {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  fill: ${COLOR.ink};
  opacity: 0.75;
}
  `;
}

export function renderCarouselSlideHTML(
  slide: Slide,
  opts: { brand?: string; ratio: CarouselRatio; index: number; total: number }
): string {
  const { ratio, index, total } = opts;
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Slide ${index + 1}</title>
<style>${styles(ratio)}</style>
</head>
<body>
${renderSlide(slide, index, total)}
</body>
</html>`;
}

export type { Presentation };
