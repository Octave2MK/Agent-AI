/**
 * Mini parseur markdown → HTML pour les rapports PDF.
 * Supporte : H1-H4, paragraphes, bullets, listes ordonnées, tables, blockquotes,
 * code inline, gras/italique, liens.
 *
 * Pas de dépendance externe — léger, suffisant pour un rapport.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return escapeHtml(s)
    // liens [texte](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // gras
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // italique
    .replace(/(?<!\*)\*([^*\s][^*]*?)\*(?!\*)/g, "<em>$1</em>")
    // code inline
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

export function markdownToHtml(markdown: string): string {
  // Strip frontmatter YAML s'il existe
  const stripped = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  const lines = stripped.split("\n");
  const out: string[] = [];
  let i = 0;

  const flushList = (list: string[], ordered: boolean) => {
    if (list.length === 0) return;
    out.push(ordered ? "<ol>" : "<ul>");
    for (const l of list) out.push(`<li>${inline(l)}</li>`);
    out.push(ordered ? "</ol>" : "</ul>");
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code fence ``` ... ```
    if (/^```/.test(line)) {
      const end = lines.findIndex((l, idx) => idx > i && /^```/.test(l));
      const content = lines.slice(i + 1, end === -1 ? lines.length : end).join("\n");
      out.push(`<pre><code>${escapeHtml(content)}</code></pre>`);
      i = end === -1 ? lines.length : end + 1;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2].trim())}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(quoteLines.join(" "))}</blockquote>`);
      continue;
    }

    // Table (ligne avec | et ligne séparatrice)
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const headerCells = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        const cells = lines[i].split("|").map((c) => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1 ? true : true);
        // filtrer les cellules vides aux extrémités
        const trimmed = cells.filter((_, idx) => !(idx === 0 && cells[0] === "") && !(idx === cells.length - 1 && cells[cells.length - 1] === ""));
        rows.push(trimmed);
        i++;
      }
      const thead = `<thead><tr>${headerCells.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, ""));
        i++;
      }
      flushList(items, false);
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      flushList(items, true);
      continue;
    }

    // Empty line → ignore
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph (1+ lignes consécutives)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) out.push(`<p>${inline(paraLines.join(" "))}</p>`);
  }

  return out.join("\n");
}
