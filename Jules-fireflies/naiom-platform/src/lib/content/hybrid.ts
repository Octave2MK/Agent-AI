/**
 * Rendu des carrousels ÉDUCATIFS en HTML éditorial (style template) → PNG.
 * 100% déterministe : schémas de flux, avant/après, stats/graphs, tableaux d'outils,
 * listes illustrées, diagrammes. Vrais logos + icônes ligne. AUCUNE image générée,
 * aucune photo, aucun élément hors-sujet.
 */
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { getLogos, type Logo } from "./logos";
import { getIcons } from "./icons";
import type { T1Content, T1Slide } from "./type1";

const OUT_DIR = path.join(process.cwd(), "public", "content-out");
const W = 1080, H = 1350;
let ORANGE = "#BE5A34", VIOLET = "#5B4DEE", INK = "#211c16", PAPER = "#ECE3CE", CARD = "#F8F1E1", MUTE = "#877c68";

/** Thème visuel par template sélectionné (le clic sur un template change le look). */
function applyTheme(refId?: string): void {
  INK = "#211c16"; VIOLET = "#5B4DEE"; CARD = "#F8F1E1"; MUTE = "#877c68";
  const t = (refId || "").replace("ig-", "");
  if (t === "type2") { ORANGE = "#1F8A6D"; PAPER = "#F0E8D6"; VIOLET = "#C0453A"; }        // craft vert/rouge
  else if (t === "type3") { ORANGE = "#3A5B9E"; PAPER = "#EDE6D6"; VIOLET = "#BE5A34"; }   // bleu magicien
  else if (t === "type4") { ORANGE = "#C85A2A"; PAPER = "#ECE4D2"; VIOLET = "#5B4DEE"; }   // burnt orange + terminal
  else { ORANGE = "#BE5A34"; PAPER = "#ECE3CE"; VIOLET = "#5B4DEE"; }                        // type1 terracotta
}

const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const A = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function iconTile(svg: string, color: string, bg: string, size = 68): string {
  const s = (svg || "").replace(/<svg /, `<svg style="width:${Math.round(size * 0.52)}px;height:${Math.round(size * 0.52)}px" `);
  return `<span class="itile" style="width:${size}px;height:${size}px;background:${bg};color:${color}">${s}</span>`;
}
function logoTile(l: Logo, size = 68): string {
  const inner = Math.round(size * 0.56);
  if (l.kind === "svgcolor" && l.svg) {
    const svg = l.svg.replace(/<svg /, `<svg preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%" `);
    return `<span class="itile" style="width:${size}px;height:${size}px;background:#fff;padding:${Math.round(size * 0.17)}px">${svg}</span>`;
  }
  if (l.kind === "img" && l.imgDataUrl) {
    return `<span class="itile" style="width:${size}px;height:${size}px;background:#fff;padding:${Math.round(size * 0.16)}px"><img src="${l.imgDataUrl}" style="width:100%;height:100%;object-fit:contain"/></span>`;
  }
  if (l.kind === "initial") {
    return `<span class="itile" style="width:${size}px;height:${size}px;background:${l.hex};color:#fff;font-family:Newsreader,serif;font-weight:800;font-size:${Math.round(size * 0.5)}px">${esc((l.name[0] || "•").toUpperCase())}</span>`;
  }
  const svg = (l.svg || "").replace(/fill="#[0-9a-fA-F]{3,6}"/, 'fill="#fff"').replace(/<svg /, `<svg style="width:${inner}px;height:${inner}px" `);
  return `<span class="itile" style="width:${size}px;height:${size}px;background:${l.hex}">${svg}</span>`;
}
function titleHTML(t: string, accent: string): string {
  const w = esc(t).split(" ");
  if (w.length < 2) return `<span style="color:${accent};font-style:italic">${w.join(" ")}</span>`;
  const last = w.pop();
  return `${w.join(" ")} <span style="color:${accent};font-style:italic">${last}</span>`;
}
function para(s: T1Slide): string {
  return s.para ? `<p class="para">${esc(s.para)}</p>` : "";
}
/** Mascotte Claude officielle (créature pixel terracotta : corps large, yeux noirs,
 *  nubs latéraux, 4 pattes). Variante "eyes": normal | happy | disk. */
const MASC_COLORS = ["#C56A4A", "#D98B3A", "#4E8C5A", "#5B6FD8", "#8A5BD0", "#C0453A"];
function mascot(size = 96, variant: "normal" | "happy" | "disk" = "normal", C = "#C56A4A"): string {
  const eyes = variant === "happy"
    ? `<path d="M62 62 l16 8 l-16 8" fill="none" stroke="#141414" stroke-width="7" stroke-linecap="round"/><path d="M138 62 l-16 8 l16 8" fill="none" stroke="#141414" stroke-width="7" stroke-linecap="round"/>`
    : `<rect x="62" y="58" width="16" height="26" fill="#141414"/><rect x="122" y="58" width="16" height="26" fill="#141414"/>`;
  const disk = variant === "disk" ? `<rect x="176" y="52" width="46" height="42" rx="3" fill="#B7B3AD"/><rect x="186" y="52" width="26" height="16" fill="#8f8b85"/><rect x="192" y="72" width="22" height="16" fill="#e6e3dd"/>` : "";
  return `<svg class="masc" style="width:${size}px;height:${Math.round(size * 0.78)}px" viewBox="0 0 224 176" xmlns="http://www.w3.org/2000/svg">
    <rect x="44" y="30" width="112" height="82" rx="6" fill="${C}"/>
    <rect x="18" y="58" width="28" height="26" fill="${C}"/>
    <rect x="154" y="58" width="28" height="26" fill="${C}"/>
    ${disk}
    ${eyes}
    <rect x="58" y="112" width="16" height="30" fill="${C}"/>
    <rect x="84" y="112" width="16" height="30" fill="${C}"/>
    <rect x="112" y="112" width="16" height="30" fill="${C}"/>
    <rect x="138" y="112" width="16" height="30" fill="${C}"/>
  </svg>`;
}
/** Petit trait dessiné sous un titre (accent éditorial). */
function underline(color = ORANGE): string {
  return `<svg class="uline" viewBox="0 0 300 18" preserveAspectRatio="none"><path d="M4 12 C 60 4, 120 16, 180 8 S 280 6, 296 11" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/></svg>`;
}
/** Étoile / sparkle décoratif. */
function star(color = ORANGE, size = 34): string {
  return `<svg style="width:${size}px;height:${size}px" viewBox="0 0 24 24" fill="${color}"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z"/></svg>`;
}
/** Bloc terminal (style Type 4). lines: chaque ligne = commande. */
function terminal(lines: string[], last?: string): string {
  return `<div class="term"><div class="term-bar"><i></i><i></i><i></i></div>
    <div class="term-body">${lines.map((l) => `<div class="tl"><span class="tp">&gt;</span> ${esc(l)}</div>`).join("")}
    ${last ? `<div class="tl tlast"><span class="tp">&gt;</span> ${esc(last)}<span class="cursor">_</span></div>` : ""}</div></div>`;
}
/** Bande de couleur diagonale décorative. */
function colorBand(color = ORANGE): string {
  return `<div class="cband" style="background:${color}"></div>`;
}
/** Post-it. */
function sticky(text: string, rot = 3): string {
  return `<div class="sticky" style="transform:rotate(${rot}deg)">${esc(text)}</div>`;
}
/** Illustration : interface de chat Claude (mockup). */
function chatCard(s: T1Slide, ctx: Ctx): string {
  const claude = ctx.logoByName.get("claude");
  const msgs = A<{ role: string; text: string }>(s.chat?.messages);
  const connect = s.chat?.connect;
  const clogo = connect ? ctx.logoByName.get(connect.toLowerCase().trim()) : undefined;
  return `<div class="chatui">
    <div class="chat-h">${claude ? logoTile(claude, 40) : ""}<span class="chat-name">Claude</span>
      ${connect ? `<span class="chat-conn">${clogo ? logoTile(clogo, 30) : ""} ${esc(connect)} connecté</span>` : ""}</div>
    <div class="chat-body">
      ${msgs.map((m) => m.role === "user"
        ? `<div class="msg user"><div class="bub ubub">${esc(m.text)}</div></div>`
        : `<div class="msg claude">${claude ? logoTile(claude, 34) : ""}<div class="bub cbub">${esc(m.text)}</div></div>`).join("")}
    </div>
    <div class="chat-input"><span>Message à Claude…</span><span class="send">➤</span></div>
  </div>`;
}
/** Illustration : note Obsidian (mockup). */
function noteCardHTML(s: T1Slide, ctx: Ctx): string {
  const n = s.noteCard ?? { title: "", lines: [] as string[] };
  const obs = ctx.logoByName.get("obsidian");
  const lines = A<string>(n.lines).map((l) => `<div class="nl">${esc(l).replace(/\[\[(.+?)\]\]/g, '<span class="wl">[[$1]]</span>').replace(/^(- |• )/, '<span class="bl">•</span> ')}</div>`).join("");
  const tags = A<string>(n.tags).map((t) => `<span class="ntag">${esc(t)}</span>`).join("");
  return `<div class="noteui">
    <div class="note-h">${obs ? logoTile(obs, 36) : ""}<span class="note-t">${esc(n.title)}</span></div>
    <div class="note-b">${lines}</div>
    ${tags ? `<div class="note-tags">${tags}</div>` : ""}
  </div>`;
}

/* ---------- layouts ---------- */
type Ctx = { icons: Record<string, string>; logoByName: Map<string, Logo> };

function head(i: number, total: number): string {
  return `<div class="top"><span class="brand">NAIOM</span><span class="pg">${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</span></div>`;
}
function foot(i: number, total: number, swipe = true): string {
  return `<div class="dots">${Array.from({ length: total }).map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>${swipe && i < total - 1 ? '<div class="swipe">Swipe →</div>' : ""}`;
}
function ic(ctx: Ctx, name: string | undefined, color: string, bg: string, size = 68): string {
  const svg = name ? ctx.icons[name] : undefined;
  return iconTile(svg ?? "", color, bg, size);
}

function cover(s: T1Slide, ctx: Ctx, logos: Logo[]): string {
  const combo = logos.length
    ? `<div class="combo">${logos.map((l, k) => `${logoTile(l, 84)}${k < logos.length - 1 ? '<span class="plus">+</span>' : ""}`).join("")}</div>`
    : "";
  return `<div class="body cover">
    <div class="kick">CARROUSEL · NAIOM</div>
    <div class="th"><h1 class="serif big">${titleHTML(s.title, ORANGE)}</h1>${underline(ORANGE)}</div>
    ${s.sub ? `<p class="lead">${esc(s.sub)}</p>` : ""}
    ${combo}
    <div class="cov-swipe">Swipe pour comprendre →</div>
  </div>`;
}

function flow(s: T1Slide, ctx: Ctx): string {
  const steps = A<{ icon?: string; label: string }>(s.steps);
  const vertical = steps.length > 3;
  const nodes = steps.map((st, k) => `
    <div class="fnode">${ic(ctx, st.icon, "#fff", ORANGE, 72)}<div class="ftext"><div class="flab">${esc(st.label)}</div>${st.desc ? `<div class="fdesc">${esc(st.desc)}</div>` : ""}</div></div>
    ${k < steps.length - 1 ? `<div class="farrow">${vertical ? "↓" : "→"}</div>` : ""}`).join("");
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ""}${para(s)}
    <div class="flow ${vertical ? "vert" : "horiz"}">${nodes}</div>
  </div>`;
}

function compare(s: T1Slide, ctx: Ctx): string {
  const before = A<string>(s.before), after = A<string>(s.after);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="cmp">
      <div class="cmp-col sans"><div class="cmp-h">Sans</div>${before.map((b) => `<div class="cmp-li"><span class="x">✕</span>${esc(b)}</div>`).join("")}</div>
      <div class="cmp-col avec"><div class="cmp-h">Avec</div>${after.map((b) => `<div class="cmp-li"><span class="v">✓</span>${esc(b)}</div>`).join("")}</div>
    </div>
  </div>`;
}

function stat(s: T1Slide, ctx: Ctx): string {
  const st = s.stat ?? { value: "", label: "" };
  const bars = A<{ label: string; pct: number }>(st.bars);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="statbig"><span class="statval">${esc(st.value)}</span><span class="statlab">${esc(st.label)}</span></div>
    ${bars.length ? `<div class="bars">${bars.map((b) => `<div class="bar"><div class="bl">${esc(b.label)}</div><div class="btrack"><div class="bfill" style="width:${Math.max(4, Math.min(100, b.pct))}%"></div></div><div class="bp">${Math.round(b.pct)}%</div></div>`).join("")}</div>` : ""}
  </div>`;
}

function tools(s: T1Slide, ctx: Ctx): string {
  const rows = A<{ tool: string; desc: string }>(s.rows);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="tlist">${rows.map((r) => {
      const l = ctx.logoByName.get(r.tool.toLowerCase().trim());
      return `<div class="trow">${l ? logoTile(l, 72) : ic(ctx, "cible", "#fff", VIOLET, 72)}<div class="tinfo"><div class="tn">${esc(r.tool)}</div><div class="td">${esc(r.desc)}</div></div></div>`;
    }).join("")}</div>
    ${s.postit ? sticky(s.postit, -3) : ""}
  </div>`;
}

function list(s: T1Slide, ctx: Ctx): string {
  const bullets = A<{ icon?: string; text: string }>(s.bullets);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ""}${para(s)}
    <div class="ll">${bullets.map((b, k) => `<div class="lli">${b.icon ? ic(ctx, b.icon, "#fff", k % 2 ? VIOLET : ORANGE, 64) : `<span class="lnum">${k + 1}</span>`}<div class="lt">${esc(b.text)}</div></div>`).join("")}</div>
    ${s.postit ? sticky(s.postit, 3) : ""}
  </div>`;
}

function diagram(s: T1Slide, ctx: Ctx): string {
  const nodes = A<{ label: string; logo?: string; icon?: string }>(s.diagram?.nodes);
  const parts = nodes.map((n, k) => {
    const l = n.logo ? ctx.logoByName.get(n.logo.toLowerCase().trim()) : undefined;
    const tile = l ? logoTile(l, 108) : ic(ctx, n.icon ?? "cerveau", "#fff", k % 2 ? VIOLET : ORANGE, 108);
    return `<div class="dnode">${tile}<div class="dlab">${esc(n.label)}</div></div>${k < nodes.length - 1 ? `<div class="darrow">⇄</div>` : ""}`;
  }).join("");
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="diag">${parts}</div>
    ${s.diagram?.caption ? `<p class="dcap">${esc(s.diagram.caption)}</p>` : ""}
  </div>`;
}

function cta(s: T1Slide, ctx: Ctx, logos: Logo[]): string {
  const termLines = logos.slice(0, 3).map((l) => `connecter ${l.name.toLowerCase()}`);
  if (!termLines.length) termLines.push("connecter tes outils", "automatiser le reste");
  return `<div class="body cta">
    <div class="th"><h1 class="serif big" style="text-align:center">${titleHTML(s.title, ORANGE)}</h1>${underline(ORANGE)}</div>
    ${s.sub ? `<p class="lead" style="text-align:center">${esc(s.sub)}</p>` : ""}
    <div style="margin-top:36px">${terminal(termLines, "débloquer tes superpouvoirs")}</div>
    <div class="pill">Commente « IA » 👇</div>
  </div>`;
}

function checklist(s: T1Slide, ctx: Ctx): string {
  const items = A<{ text: string; done?: boolean }>(s.checklist);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="illus-wrap"><div class="checkui">
      ${items.map((it) => `<div class="ck ${it.done ? "on" : ""}"><span class="ckbox">${it.done ? "✓" : ""}</span><span class="cktxt">${esc(it.text)}</span></div>`).join("")}
    </div></div>
    ${s.postit ? sticky(s.postit, -3) : ""}
  </div>`;
}
function timeline(s: T1Slide, ctx: Ctx): string {
  const items = A<{ when: string; label: string }>(s.timeline);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="tline">${items.map((it, k) => `<div class="tlrow"><div class="tldot" style="background:${MASC_COLORS[k % MASC_COLORS.length]}"></div><div class="tlc"><div class="tlwhen">${esc(it.when)}</div><div class="tllabel">${esc(it.label)}</div></div></div>`).join("")}</div>
  </div>`;
}
function network(s: T1Slide, ctx: Ctx): string {
  const nodes = A<string>(s.network?.nodes).slice(0, 7);
  const cx = 350, cy = 250, R = 195, w = 700, h = 500;
  const pos = nodes.map((n, k) => {
    if (k === 0) return { x: cx, y: cy, n, c: ORANGE, r: 74 };
    const ang = ((k - 1) / Math.max(1, nodes.length - 1)) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), n, c: MASC_COLORS[k % MASC_COLORS.length], r: 58 };
  });
  const lines = pos.slice(1).map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="rgba(0,0,0,.18)" stroke-width="3"/>`).join("");
  // quelques liens entre périphériques
  const extra = pos.length > 3 ? `<line x1="${pos[1].x}" y1="${pos[1].y}" x2="${pos[2].x}" y2="${pos[2].y}" stroke="rgba(0,0,0,.1)" stroke-width="2"/><line x1="${pos[pos.length-1].x}" y1="${pos[pos.length-1].y}" x2="${pos[1].x}" y2="${pos[1].y}" stroke="rgba(0,0,0,.1)" stroke-width="2"/>` : "";
  const circles = pos.map((p) => `<g><circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.c}"/>
    <foreignObject x="${p.x - p.r}" y="${p.y - p.r}" width="${p.r * 2}" height="${p.r * 2}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:6px;color:#fff;font-family:Inter,sans-serif;font-weight:700;font-size:${p.r > 70 ? 20 : 16}px;line-height:1.1">${esc(p.n)}</div>
    </foreignObject></g>`).join("");
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="illus-wrap"><svg viewBox="0 0 ${w} ${h}" style="width:760px;height:auto">${lines}${extra}${circles}</svg></div>
    ${s.network?.caption ? `<p class="dcap">${esc(s.network.caption)}</p>` : ""}
  </div>`;
}
function screen(s: T1Slide, ctx: Ctx): string {
  const app = s.screen?.app ?? "";
  const logo = ctx.logoByName.get(app.toLowerCase().trim());
  const rows = A<string>(s.screen?.rows);
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="illus-wrap"><div class="winui">
      <div class="win-bar"><i></i><i></i><i></i><div class="win-app">${logo ? logoTile(logo, 30) : ""}<span>${esc(app)}</span></div></div>
      <div class="win-body">${rows.map((r, k) => `<div class="wrow"><span class="wdot" style="background:${MASC_COLORS[k % MASC_COLORS.length]}"></span><span>${esc(r)}</span></div>`).join("")}</div>
    </div></div>
    ${s.postit ? sticky(s.postit, -3) : ""}
  </div>`;
}
function chat(s: T1Slide, ctx: Ctx): string {
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, ORANGE)}</h2>${underline(ORANGE)}</div>
    ${para(s)}
    <div class="illus-wrap">${chatCard(s, ctx)}</div>
  </div>`;
}
function noteLayout(s: T1Slide, ctx: Ctx): string {
  return `<div class="body">
    <div class="th"><h2 class="serif">${titleHTML(s.title, VIOLET)}</h2>${underline(VIOLET)}</div>
    ${para(s)}
    <div class="illus-wrap">${noteCardHTML(s, ctx)}</div>
  </div>`;
}
function deco(layout: string, i: number): string {
  const col = MASC_COLORS[i % MASC_COLORS.length];
  const col2 = MASC_COLORS[(i + 2) % MASC_COLORS.length];
  const star1 = `<div class="dstar dstar-tr">${star(ORANGE, 40)}</div><div class="dstar dstar-bl">${star(VIOLET, 26)}</div>`;
  if (layout === "cover") return colorBand(ORANGE) + star1 + `<div class="m-cover">${mascot(170, "happy", ORANGE)}</div>`;
  if (layout === "chat") return star1 + `<div class="m-corner">${mascot(104, "normal", col)}</div>`;
  if (layout === "note") return star1 + `<div class="m-corner">${mascot(104, "disk", VIOLET)}</div>`;
  if (layout === "cta") return colorBand(col2) + star1 + `<div class="m-corner">${mascot(110, "happy", col)}</div>`;
  return star1 + `<div class="m-corner">${mascot(112, i % 2 ? "happy" : "normal", col)}</div>`;
}
function slideHTML(s: T1Slide, ctx: Ctx, logos: Logo[], i: number, total: number): string {
  const inner =
    s.layout === "cover" ? cover(s, ctx, logos)
    : s.layout === "flow" ? flow(s, ctx)
    : s.layout === "compare" ? compare(s, ctx)
    : s.layout === "stat" ? stat(s, ctx)
    : s.layout === "tools" ? tools(s, ctx)
    : s.layout === "diagram" ? diagram(s, ctx)
    : s.layout === "chat" ? chat(s, ctx)
    : s.layout === "note" ? noteLayout(s, ctx)
    : s.layout === "checklist" ? checklist(s, ctx)
    : s.layout === "timeline" ? timeline(s, ctx)
    : s.layout === "network" ? network(s, ctx)
    : s.layout === "screen" ? screen(s, ctx)
    : s.layout === "cta" ? cta(s, ctx, logos)
    : list(s, ctx);
  const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  .slide{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER};
    background-image:radial-gradient(rgba(0,0,0,.028) 1px,transparent 1px);background-size:7px 7px;font-family:Inter,sans-serif;color:${INK}}
  .slide:before{content:"";position:absolute;top:0;left:0;right:0;height:340px;background:radial-gradient(120% 80% at 15% 0%, rgba(226,74,27,.10), transparent 60%)}
  .serif{font-family:Newsreader,serif;font-weight:800;letter-spacing:-.02em;line-height:1.02}
  .top{position:absolute;top:56px;left:64px;right:64px;display:flex;justify-content:space-between;font-size:22px;font-weight:700;color:${MUTE}}
  .pg{font-variant-numeric:tabular-nums}
  .body{position:absolute;top:130px;left:64px;right:64px;bottom:120px;display:flex;flex-direction:column}
  h2.serif{font-size:70px;color:${INK}} h1.big{font-size:92px;color:${INK}}
  .sub{font-size:30px;color:${MUTE};margin-top:16px;font-weight:600;max-width:900px}
  .lead{font-size:34px;color:#4a433a;margin-top:22px;font-weight:600;line-height:1.35;max-width:840px}
  .kick{font-size:20px;font-weight:800;letter-spacing:.18em;color:${ORANGE};margin-bottom:24px}
  .itile{border-radius:20px;display:inline-flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.14);flex:none}
  .itile svg{stroke-width:2}
  .cover{justify-content:center}.combo{display:flex;align-items:center;gap:22px;margin-top:48px}.plus{font-size:44px;color:${MUTE};font-weight:300}
  .cov-swipe{position:absolute;bottom:0;font-size:24px;color:${ORANGE};font-weight:800}
  /* flow */
  .flow{margin-top:auto;margin-bottom:auto;display:flex;align-items:center;justify-content:center;gap:10px}
  .flow.vert{flex-direction:column}
  .fnode{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;width:230px}
  .flow.vert .fnode{flex-direction:row;width:auto;gap:22px;text-align:left;justify-content:flex-start;width:640px}
  .flab{font-size:26px;font-weight:700;line-height:1.2}
  .farrow{font-size:46px;color:${ORANGE};font-weight:800}
  /* compare */
  .cmp{margin-top:44px;display:flex;gap:26px;flex:1}
  .cmp-col{flex:1;border-radius:24px;padding:30px 28px}
  .cmp-col.sans{background:#ECE4D6;border:1px solid #ddd3c2}
  .cmp-col.avec{background:${CARD};border:2px solid ${ORANGE}}
  .cmp-h{font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:20px}
  .cmp-col.sans .cmp-h{color:${MUTE}} .cmp-col.avec .cmp-h{color:${ORANGE}}
  .cmp-li{display:flex;gap:12px;font-size:27px;line-height:1.3;margin-bottom:18px;align-items:flex-start}
  .cmp-li .x{color:#b06a4a;font-weight:800}.cmp-li .v{color:${ORANGE};font-weight:800}
  /* stat */
  .statbig{margin-top:40px;display:flex;align-items:baseline;gap:24px}
  .statval{font-family:Newsreader,serif;font-weight:800;font-size:200px;color:${ORANGE};line-height:.9}
  .statlab{font-size:34px;font-weight:700;color:#4a433a;max-width:360px}
  .bars{margin-top:50px;display:flex;flex-direction:column;gap:26px}
  .bar{display:flex;align-items:center;gap:20px}
  .bl{width:250px;font-size:26px;font-weight:700}
  .btrack{flex:1;height:34px;background:#E4DAC8;border-radius:999px;overflow:hidden}
  .bfill{height:100%;background:linear-gradient(90deg,${ORANGE},#F4A15C);border-radius:999px}
  .bp{width:80px;text-align:right;font-size:26px;font-weight:800;color:${ORANGE}}
  /* tools */
  .tlist{margin-top:44px;display:flex;flex-direction:column;gap:30px}
  .trow{display:flex;align-items:center;gap:24px}
  .tinfo .tn{font-size:32px;font-weight:800}.tinfo .td{font-size:26px;color:#4a433a;margin-top:4px;line-height:1.3}
  /* list */
  .ll{margin-top:40px;display:flex;flex-direction:column;gap:26px}
  .lli{display:flex;gap:22px;align-items:center}
  .lnum{width:60px;height:60px;border-radius:16px;background:${INK};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:30px;flex:none}
  .lt{font-size:30px;line-height:1.28;font-weight:600}
  /* diagram */
  .diag{margin:auto 0;display:flex;align-items:center;justify-content:center;gap:20px}
  .dnode{display:flex;flex-direction:column;align-items:center;gap:16px}
  .dlab{font-size:30px;font-weight:800}
  .darrow{font-size:64px;color:${VIOLET};font-weight:300}
  .dcap{text-align:center;font-size:28px;color:#4a433a;font-weight:600;margin-top:16px}
  /* cta */
  .cta{align-items:center;justify-content:center}
  .pill{margin-top:40px;background:${ORANGE};color:#fff;font-weight:800;font-size:30px;padding:20px 44px;border-radius:999px}
  /* footer */
  .dots{position:absolute;left:0;right:0;bottom:56px;display:flex;justify-content:center;gap:10px}
  .dots i{width:11px;height:11px;border-radius:50%;background:rgba(0,0,0,.16)}.dots i.on{background:${ORANGE}}
  .swipe{position:absolute;right:64px;bottom:48px;font-size:22px;font-weight:800;color:${ORANGE}}
  /* paragraphe */
  .para{font-size:27px;line-height:1.42;color:#4a433a;font-weight:500;margin-top:16px;max-width:900px}
  /* mascotte */
  .masc{display:block;filter:drop-shadow(0 8px 14px rgba(0,0,0,.16))}
  .illus-wrap{margin-top:34px;display:flex;justify-content:center}
  /* flow desc */
  .ftext{display:flex;flex-direction:column} .flow.horiz .ftext{align-items:center;text-align:center}
  .fdesc{font-size:19px;color:${MUTE};font-weight:500;margin-top:4px;line-height:1.25}
  .flow.vert .fnode{width:760px}
  /* chat UI (illustration Claude) */
  .chatui{width:760px;background:#fff;border:1px solid #e7ddcb;border-radius:26px;box-shadow:0 18px 46px rgba(0,0,0,.12);overflow:hidden}
  .chat-h{display:flex;align-items:center;gap:14px;padding:20px 26px;border-bottom:1px solid #f0e9dc}
  .chat-name{font-size:26px;font-weight:800;color:${INK}}
  .chat-conn{margin-left:auto;display:flex;align-items:center;gap:8px;background:#eef0ff;color:${VIOLET};font-weight:700;font-size:19px;padding:8px 14px;border-radius:999px}
  .chat-body{padding:22px 26px;display:flex;flex-direction:column;gap:18px;background:#faf7f1}
  .msg{display:flex;gap:12px;align-items:flex-end}.msg.user{justify-content:flex-end}
  .bub{max-width:78%;font-size:23px;line-height:1.4;padding:16px 20px;border-radius:20px}
  .ubub{background:${INK};color:#fff;border-bottom-right-radius:6px}
  .cbub{background:#fff;border:1px solid #ece3d3;color:${INK};border-bottom-left-radius:6px}
  .chat-input{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-top:1px solid #f0e9dc;color:${MUTE};font-size:22px}
  .chat-input .send{width:40px;height:40px;border-radius:50%;background:${ORANGE};color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px}
  /* note UI (illustration Obsidian) */
  .noteui{width:720px;background:#1e1b2e;border:1px solid #322c48;border-radius:24px;box-shadow:0 18px 46px rgba(0,0,0,.2);padding:28px 30px;color:#e7e3f5}
  .note-h{display:flex;align-items:center;gap:14px;padding-bottom:18px;border-bottom:1px solid #322c48;margin-bottom:18px}
  .note-t{font-size:28px;font-weight:800}
  .note-b{display:flex;flex-direction:column;gap:12px;font-family:'Inter',sans-serif;font-size:23px;line-height:1.5}
  .nl{color:#cfc9e6} .wl{color:#a99bff;font-weight:700} .bl{color:${VIOLET};font-weight:800}
  .note-tags{display:flex;gap:10px;margin-top:22px}
  .ntag{background:#2c2743;color:#a99bff;font-weight:700;font-size:19px;padding:7px 14px;border-radius:999px}
  /* titre + trait dessiné */
  .th{position:relative;display:inline-block;max-width:920px}
  .th .uline{position:absolute;left:2px;right:20%;bottom:-14px;height:20px;width:70%}
  h1.big .uline,.cover .th .uline{width:60%}
  /* déco */
  .dstar{position:absolute;opacity:.9}
  .dstar-tr{top:150px;right:70px} .dstar-bl{bottom:150px;left:66px;opacity:.7}
  .m-cover{position:absolute;right:40px;bottom:150px;z-index:3}
  .m-corner{position:absolute;right:48px;bottom:140px;opacity:.98;z-index:3}
  /* bande de couleur diagonale */
  .cband{position:absolute;left:-120px;bottom:-80px;width:520px;height:300px;transform:rotate(-24deg);border-radius:60px;opacity:.9;z-index:1}
  .body,.top{z-index:2}
  /* terminal (style Type 4) */
  .term{width:820px;background:#1b1a17;border-radius:18px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.22)}
  .term-bar{display:flex;gap:9px;padding:16px 20px;background:#26241f}
  .term-bar i{width:15px;height:15px;border-radius:50%;background:#4a4640}
  .term-bar i:nth-child(1){background:#ff5f56}.term-bar i:nth-child(2){background:#ffbd2e}.term-bar i:nth-child(3){background:#27c93f}
  .term-body{padding:24px 26px;font-family:'JetBrains Mono',monospace;font-size:26px;line-height:1.7;color:#e7e2d6}
  .tl .tp{color:#E9A15C;font-weight:700;margin-right:10px}
  .tlast{color:#F5A15C;font-weight:700}.cursor{color:#E9A15C;animation:none}
  /* post-it */
  .sticky{position:absolute;left:64px;bottom:210px;background:#F3E1B0;padding:22px 24px;font-family:'Caveat',cursive;font-size:34px;color:#5a4a24;box-shadow:0 8px 18px rgba(0,0,0,.14);max-width:340px;line-height:1.12;z-index:2}
  .hand{font-family:'Caveat',cursive}
  /* checklist */
  .checkui{width:820px;background:${CARD};border:1px solid #e3d9c4;border-radius:22px;padding:30px 34px;box-shadow:0 12px 30px rgba(0,0,0,.08)}
  .ck{display:flex;align-items:center;gap:20px;padding:16px 0;border-bottom:1px solid #eadfca;font-size:30px}
  .ck:last-child{border-bottom:none}
  .ckbox{width:46px;height:46px;border-radius:12px;border:3px solid #cdbf9f;display:flex;align-items:center;justify-content:center;font-size:28px;color:#fff;flex:none}
  .ck.on .ckbox{background:${ORANGE};border-color:${ORANGE}}
  .ck.on .cktxt{color:${INK}} .cktxt{color:#4a433a;font-weight:600} .ck:not(.on) .cktxt{color:#8a7f6b}
  /* timeline */
  .tline{margin-top:40px;position:relative;padding-left:20px}
  .tline:before{content:"";position:absolute;left:33px;top:10px;bottom:10px;width:4px;background:#e0d5bf}
  .tlrow{display:flex;gap:26px;align-items:flex-start;margin-bottom:34px;position:relative}
  .tldot{width:30px;height:30px;border-radius:50%;flex:none;margin-top:6px;box-shadow:0 0 0 6px ${PAPER}}
  .tlwhen{font-size:24px;font-weight:800;color:${ORANGE}} .tllabel{font-size:28px;color:#3d372c;margin-top:4px;line-height:1.3;font-weight:600}
  .tlc{padding-top:2px}
  /* window / interface d'outil */
  .winui{width:830px;background:#fff;border:1px solid #e3d9c4;border-radius:20px;overflow:hidden;box-shadow:0 16px 40px rgba(0,0,0,.12)}
  .win-bar{display:flex;align-items:center;gap:10px;padding:18px 22px;background:#f4efe6;border-bottom:1px solid #eadfca}
  .win-bar>i{width:14px;height:14px;border-radius:50%}
  .win-bar>i:nth-child(1){background:#ff5f56}.win-bar>i:nth-child(2){background:#ffbd2e}.win-bar>i:nth-child(3){background:#27c93f}
  .win-app{margin-left:14px;display:flex;align-items:center;gap:10px;font-size:24px;font-weight:800;color:${INK}}
  .win-body{padding:22px 26px;display:flex;flex-direction:column}
  .wrow{display:flex;align-items:center;gap:18px;padding:16px 4px;border-bottom:1px solid #f1ece2;font-size:26px;color:#2f2a22;font-weight:500}
  .wrow:last-child{border-bottom:none}
  .wdot{width:16px;height:16px;border-radius:5px;flex:none}
  `;
  return `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,700;0,6..72,800;1,6..72,800&family=Inter:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@600;700&display=swap" rel="stylesheet"><style>${CSS}</style></head><body><div class="slide">${head(i, total)}${inner}${foot(i, total)}${deco(s.layout, i)}</div></body></html>`;
}

/* ---------- pipeline (100% HTML, pas de Higgsfield) ---------- */
export async function composeType1(postId: string, content: T1Content, refId?: string): Promise<string[]> {
  applyTheme(refId);
  const logos = await getLogos(content.tools);
  const logoByName = new Map(logos.map((l) => [l.name.toLowerCase().trim(), l]));
  // récupère toutes les icônes citées
  const iconNames = new Set<string>(["cible", "cerveau"]);
  for (const s of content.slides) {
    A<{ icon?: string }>(s.steps).forEach((x) => x.icon && iconNames.add(x.icon));
    A<{ icon?: string }>(s.bullets).forEach((x) => x.icon && iconNames.add(x.icon));
    A<{ icon?: string }>(s.diagram?.nodes).forEach((x) => x.icon && iconNames.add(x.icon));
  }
  const icons = await getIcons([...iconNames]);
  const ctx: Ctx = { icons, logoByName };

  await fs.mkdir(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  const urls: string[] = [];
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    for (let i = 0; i < content.slides.length; i++) {
      const html = slideHTML(content.slides[i], ctx, logos, i, content.slides.length);
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
      await Promise.race([
        page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
        new Promise((r) => setTimeout(r, 3000)),
      ]).catch(() => {});
      await new Promise((r) => setTimeout(r, 250));
      const file = `${postId}-${i}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, file) });
      urls.push(`/content-out/${file}?v=${Date.now()}`);
    }
  } finally { await browser.close(); }
  return urls;
}
