import { markdownToHtml } from "./markdownToHtml";

export interface Report {
  title: string;
  subtitle?: string;
  brand?: string; // défaut : "NAIOM"
  date?: string; // format libre, sinon mois courant
  author?: string;
  category?: string; // "RAPPORT" / "ANALYSE" / "SYNTHÈSE" — apparaît en tag sur la couverture
  markdown: string; // contenu complet du rapport
}

const COLOR = {
  bg: "#E8E4DD",
  paper: "#F7F5F0", // pages intérieures, plus clair pour lisibilité
  ink: "#121212",
  accent: "#E8461F",
  accent2: "#F57444",
  pink: "#F574AB",
  purple: "#B464D3",
  muted: "#6B7287",
  line: "#DAD7D0",
};

function fmtDate(d?: string): string {
  if (d) return d.toUpperCase();
  const now = new Date();
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

function gradientBlob(cx: number, cy: number, r: number, color: string, opacity = 0.85): string {
  return `<div class="blob" style="left:${cx}%;top:${cy}%;width:${r}%;height:${r}%;background:radial-gradient(circle, ${color} 0%, ${color}CC 25%, transparent 60%);opacity:${opacity};"></div>`;
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

@page { margin: 0; size: A4; }
@page :first { margin: 0; }

html, body {
  background: ${COLOR.bg};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${COLOR.ink};
  -webkit-font-smoothing: antialiased;
  font-size: 10pt;
  line-height: 1.5;
}

.page {
  position: relative;
  width: 210mm;
  min-height: 297mm;
  padding: 24mm 22mm 22mm;
  background: ${COLOR.paper};
  overflow: hidden;
  page-break-after: always;
}

.page:last-child { page-break-after: auto; }

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}

.page-content { position: relative; z-index: 2; }

.page-footer {
  position: absolute;
  bottom: 12mm;
  left: 22mm;
  right: 22mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 8pt;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: ${COLOR.muted};
  border-top: 1px solid ${COLOR.line};
  padding-top: 6mm;
  z-index: 5;
}

/* ---------- COUVERTURE ---------- */

.cover {
  background: ${COLOR.bg};
  padding: 24mm 22mm 22mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 297mm;
}

.cover-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 9pt;
  font-weight: 800;
  letter-spacing: 0.18em;
  position: relative;
  z-index: 5;
}

.cover-title {
  position: relative;
  z-index: 5;
}
.cover-category {
  font-size: 10pt;
  font-weight: 800;
  letter-spacing: 0.2em;
  color: ${COLOR.accent};
  margin-bottom: 18mm;
  text-transform: uppercase;
}
.cover-h1 {
  font-size: 62pt;
  font-weight: 900;
  line-height: 0.94;
  letter-spacing: -0.03em;
  max-width: 100%;
}
.cover-subtitle {
  margin-top: 10mm;
  max-width: 140mm;
  font-size: 11pt;
  font-weight: 600;
  line-height: 1.4;
  color: ${COLOR.ink};
}

.cover-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 9pt;
  font-weight: 800;
  letter-spacing: 0.15em;
  position: relative;
  z-index: 5;
}
.cover-footer-meta { display: flex; flex-direction: column; gap: 2mm; }
.cover-footer-label { color: ${COLOR.muted}; font-size: 8pt; }

/* ---------- CONTENU ---------- */

.prose h1 {
  font-size: 28pt;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.02em;
  margin: 12mm 0 6mm;
  color: ${COLOR.ink};
}
.prose h1:first-child { margin-top: 0; }

.prose h2 {
  font-size: 16pt;
  font-weight: 800;
  line-height: 1.15;
  margin: 10mm 0 4mm;
  color: ${COLOR.ink};
  padding-bottom: 3mm;
  border-bottom: 2px solid ${COLOR.accent};
}

.prose h3 {
  font-size: 12pt;
  font-weight: 800;
  margin: 7mm 0 3mm;
  color: ${COLOR.ink};
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.prose h4 {
  font-size: 10pt;
  font-weight: 800;
  margin: 5mm 0 2mm;
  color: ${COLOR.accent};
}

.prose p {
  margin: 0 0 4mm;
  font-size: 10pt;
  line-height: 1.6;
}

.prose strong { font-weight: 700; color: ${COLOR.ink}; }
.prose em { font-style: italic; }

.prose a {
  color: ${COLOR.accent};
  text-decoration: none;
  border-bottom: 1px solid ${COLOR.accent};
}

.prose code {
  background: ${COLOR.bg};
  padding: 1mm 2mm;
  border-radius: 2px;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 8.5pt;
  color: ${COLOR.ink};
}

.prose pre {
  background: ${COLOR.ink};
  color: ${COLOR.paper};
  padding: 5mm 6mm;
  border-radius: 2mm;
  margin: 4mm 0;
  overflow-x: auto;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 8.5pt;
  line-height: 1.5;
}
.prose pre code {
  background: transparent;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

.prose blockquote {
  border-left: 3px solid ${COLOR.accent};
  padding: 2mm 6mm;
  margin: 4mm 0;
  background: ${COLOR.bg};
  font-style: italic;
  font-size: 10pt;
  color: ${COLOR.ink};
}

.prose ul, .prose ol {
  margin: 0 0 4mm 6mm;
  padding: 0;
}
.prose li { margin: 0 0 1.5mm; font-size: 10pt; line-height: 1.55; }
.prose ul li { list-style: none; position: relative; padding-left: 5mm; }
.prose ul li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2.2mm;
  width: 2mm;
  height: 2mm;
  background: ${COLOR.accent};
  border-radius: 50%;
}
.prose ol { list-style-position: inside; }
.prose ol li { padding-left: 1mm; }
.prose ol li::marker { font-weight: 800; color: ${COLOR.accent}; }

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 4mm 0;
  font-size: 9pt;
}
.prose th, .prose td {
  padding: 2.5mm 3mm;
  border-bottom: 1px solid ${COLOR.line};
  text-align: left;
  vertical-align: top;
}
.prose th {
  background: ${COLOR.bg};
  font-weight: 800;
  font-size: 8.5pt;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${COLOR.ink};
  border-bottom: 2px solid ${COLOR.ink};
}

.prose hr {
  border: 0;
  border-top: 1px solid ${COLOR.line};
  margin: 8mm 0;
}

/* Dernière page (résumé / merci) */

.closing {
  min-height: 297mm;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24mm 22mm;
  background: ${COLOR.bg};
  position: relative;
  overflow: hidden;
  page-break-after: auto;
}

.closing h1 {
  font-size: 72pt;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.03em;
  position: relative;
  z-index: 5;
}

.closing-body {
  margin-top: 12mm;
  max-width: 140mm;
  font-size: 10pt;
  font-weight: 600;
  line-height: 1.5;
  color: ${COLOR.ink};
  position: relative;
  z-index: 5;
}

.closing-resources {
  margin-top: 16mm;
  font-size: 9pt;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${COLOR.ink};
  position: relative;
  z-index: 5;
}
.closing-resources div { line-height: 1.8; }
`;

export function renderReportHTML(report: Report): string {
  const brand = (report.brand ?? "NAIOM").toUpperCase();
  const date = fmtDate(report.date);
  const category = (report.category ?? "RAPPORT").toUpperCase();
  const contentHtml = markdownToHtml(report.markdown);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>${STYLES}</style>
</head>
<body>
  <!-- COVER -->
  <section class="cover">
    ${gradientBlob(-20, -15, 55, COLOR.accent, 0.75)}
    ${gradientBlob(75, 70, 55, COLOR.pink, 0.6)}
    ${gradientBlob(35, 85, 40, COLOR.accent2, 0.55)}
    <header class="cover-header">
      <span>${escapeHtml(brand)}</span>
      <span>${escapeHtml(date)}</span>
    </header>
    <div class="cover-title">
      <div class="cover-category">${escapeHtml(category)}</div>
      <h1 class="cover-h1">${escapeHtml(report.title)}</h1>
      ${report.subtitle ? `<p class="cover-subtitle">${escapeHtml(report.subtitle)}</p>` : ""}
    </div>
    <div class="cover-footer">
      <div class="cover-footer-meta">
        <span class="cover-footer-label">Produit par</span>
        <span>${escapeHtml(report.author ?? "Plateforme NAIOM — Agents IA")}</span>
      </div>
      <div class="cover-footer-meta" style="text-align:right">
        <span class="cover-footer-label">Référence</span>
        <span>${escapeHtml(brand)} · ${escapeHtml(date)}</span>
      </div>
    </div>
  </section>

  <!-- CONTENT PAGE -->
  <section class="page">
    <div class="page-content prose">
      ${contentHtml}
    </div>
    <footer class="page-footer">
      <span>${escapeHtml(brand)} · ${escapeHtml(report.title.slice(0, 60))}</span>
      <span>${escapeHtml(date)}</span>
    </footer>
  </section>
</body>
</html>`;
}
