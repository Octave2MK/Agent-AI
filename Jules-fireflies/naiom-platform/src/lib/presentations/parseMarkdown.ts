import type { Presentation, Slide } from "./template";

/**
 * Parse un deck en markdown produit par l'agent Présentateur et le convertit
 * en structure de slides pour le renderer PDF.
 *
 * Formats supportés :
 * - Frontmatter YAML (optionnel) pour title / date / brand
 * - H1 (# ...) = titre du deck (devient slide 1 "title")
 * - Paragraphe juste après H1 = subtitle
 * - H2 (## ...) = nouvelle slide (kind "content" par défaut)
 * - Contenu sous H2 = body
 * - Mots-clés dans H2 pour forcer un kind :
 *     [toc]       → slide sommaire (les bullets deviennent les items numerotés)
 *     [stat] 70%  → slide stat
 *     [quote]     → slide citation
 *     [thanks]    → slide merci
 */
export function parseDeckMarkdown(markdown: string, fallbackTitle = "Présentation"): Presentation {
  const cleaned = markdown.trim();
  if (!cleaned) return { title: fallbackTitle, slides: [] };

  // Parse frontmatter
  let body = cleaned;
  let fmTitle: string | undefined;
  let fmBrand: string | undefined;
  let fmDate: string | undefined;
  const fmMatch = cleaned.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fmMatch) {
    const fm = fmMatch[1];
    body = cleaned.slice(fmMatch[0].length);
    for (const line of fm.split("\n")) {
      const m = line.match(/^([a-zA-Z_-]+):\s*"?(.+?)"?$/);
      if (!m) continue;
      const k = m[1].toLowerCase();
      if (k === "title" || k === "titre" || k === "campagne") fmTitle = m[2];
      if (k === "brand" || k === "marque") fmBrand = m[2];
      if (k === "date") fmDate = m[2];
    }
  }

  const lines = body.split("\n");
  const blocks: { heading: string; level: 1 | 2; content: string[] }[] = [];
  let current: { heading: string; level: 1 | 2; content: string[] } | null = null;

  for (const raw of lines) {
    const h1 = raw.match(/^#\s+(.+)/);
    const h2 = raw.match(/^##\s+(.+)/);
    if (h1) {
      if (current) blocks.push(current);
      current = { heading: h1[1].trim(), level: 1, content: [] };
    } else if (h2) {
      if (current) blocks.push(current);
      current = { heading: h2[1].trim(), level: 2, content: [] };
    } else if (current) {
      current.content.push(raw);
    }
  }
  if (current) blocks.push(current);

  const deckTitle = fmTitle ?? blocks.find((b) => b.level === 1)?.heading ?? fallbackTitle;
  const deckSubtitle = (() => {
    const h1 = blocks.find((b) => b.level === 1);
    if (!h1) return undefined;
    const text = h1.content.join("\n").trim();
    if (!text) return undefined;
    const firstPara = text.split(/\n\s*\n/)[0];
    return firstPara.replace(/[*_`]/g, "").slice(0, 200);
  })();

  const slides: Slide[] = [];

  // Titre = première slide
  slides.push({
    kind: "title",
    title: deckTitle,
    subtitle: deckSubtitle,
    category: (fmBrand ?? "NAIOM").toUpperCase(),
  });

  // Pour chaque H2 → 1 slide
  const h2Blocks = blocks.filter((b) => b.level === 2);
  for (const b of h2Blocks) {
    const fullText = b.content.join("\n").trim();
    const heading = b.heading;

    // Detect kind via heading tag
    const tagMatch = heading.match(/\[(toc|stat|quote|thanks|bars|line|compare|flow|pillars|kpi|matrix|valuechain|orgchart)\](.*)$/i);
    const kind = tagMatch?.[1]?.toLowerCase();
    const cleanHeading = tagMatch ? tagMatch[2].trim() || heading.replace(tagMatch[0], "").trim() : heading;

    if (kind === "toc") {
      // Les bullets deviennent items
      const items = fullText
        .split(/\n/)
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 8)
        .map((label, i) => ({ num: String(i + 1).padStart(2, "0"), label }));
      slides.push({ kind: "toc", items });
      continue;
    }

    if (kind === "stat") {
      // Attendu : "+16 % vs Q1 FY2025 (123,9 Mrd$)" ou "70 % — caption" ou "×2,3 – caption"
      // Accepte signes + / - / ×, virgule décimale, suffixes %, x, k, M, Mrd, €, $.
      const firstLine = fullText.split("\n")[0] ?? "";
      const bigMatch = firstLine.match(
        /^([+\-−]?\s*[\d][\d\s.,]*\s*(?:%|x|Mrd\$?|Mrd€?|M\$?|M€?|k|K|€|\$)?|[×x]\s*[\d.,]+)\s*[-—–:]?\s*(.*)$/
      );
      const rawValue = bigMatch?.[1]?.trim() ?? firstLine.split(/\s+[-—–]\s+/, 2)[0]?.trim() ?? firstLine.slice(0, 12);
      const bigValue = rawValue.replace(/\s+/g, " ");
      const restOfLine = (bigMatch?.[2] ?? firstLine.split(/\s+[-—–]\s+/, 2)[1] ?? "").trim();
      const caption = restOfLine || cleanHeading;
      const rest = fullText.split("\n").slice(1).join(" ").trim();
      slides.push({
        kind: "stat",
        title: cleanHeading,
        bigValue,
        caption,
        body: rest || undefined,
      });
      continue;
    }

    if (kind === "quote") {
      const firstLine = fullText.split("\n").find((l) => l.trim()) ?? "";
      const attrLine = fullText
        .split("\n")
        .slice(1)
        .find((l) => l.trim().startsWith("—") || l.trim().startsWith("-"));
      slides.push({
        kind: "quote",
        quote: firstLine.replace(/^[«»"']?|[«»"']?$/g, "").trim(),
        attribution: attrLine?.replace(/^[-—]\s*/, "").trim(),
      });
      continue;
    }

    if (kind === "bars") {
      // Format : "- Label : 123" ou "- Label | 123" ou "Label : 123"
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      const bodyLines: string[] = [];
      const data: { label: string; value: number }[] = [];
      for (const l of lines) {
        const cleaned = l.replace(/^[-*•]\s*/, "");
        const m = cleaned.match(/^(.+?)\s*[|:：]\s*([\d\s.,]+)\s*%?$/);
        if (m) {
          const value = parseFloat(m[2].replace(/\s/g, "").replace(/,/g, "."));
          if (!isNaN(value)) data.push({ label: m[1].trim(), value });
        } else if (!data.length) {
          bodyLines.push(cleaned);
        }
      }
      if (data.length >= 2) {
        slides.push({
          kind: "bars",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          data: data.slice(0, 8),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "line") {
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      const bodyLines: string[] = [];
      const data: { label: string; value: number }[] = [];
      for (const l of lines) {
        const cleaned = l.replace(/^[-*•]\s*/, "");
        const m = cleaned.match(/^(.+?)\s*[|:：]\s*([\d\s.,]+)\s*%?$/);
        if (m) {
          const value = parseFloat(m[2].replace(/\s/g, "").replace(/,/g, "."));
          if (!isNaN(value)) data.push({ label: m[1].trim(), value });
        } else if (!data.length) {
          bodyLines.push(cleaned);
        }
      }
      if (data.length >= 2) {
        slides.push({
          kind: "line",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          data: data.slice(0, 12),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "kpi") {
      // Format : "- VALEUR | Label | delta" ou "- VALEUR | Label"
      // Delta détecte +/- et ↑/↓ pour kind
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      const bodyLines: string[] = [];
      const cards: { value: string; label: string; delta?: string; deltaKind?: "up" | "down" | "flat" }[] = [];
      for (const l of lines) {
        const cleaned = l.replace(/^[-*•]\s*/, "");
        const parts = cleaned.split(/\s*\|\s*/).map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          const delta = parts[2] || undefined;
          let deltaKind: "up" | "down" | "flat" | undefined;
          if (delta) {
            if (/^(\+|\▲|↑|\bup\b)/i.test(delta) || /^\+\d/.test(delta)) deltaKind = "up";
            else if (/^(-|\▼|↓|\bdown\b|baisse)/i.test(delta) || /^-\d/.test(delta)) deltaKind = "down";
            else if (/stable|flat|=|constant/i.test(delta)) deltaKind = "flat";
            else deltaKind = "up";
          }
          cards.push({ value: parts[0], label: parts[1], delta, deltaKind });
        } else if (!cards.length) {
          bodyLines.push(cleaned);
        }
      }
      if (cards.length >= 2) {
        slides.push({
          kind: "kpi",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          cards: cards.slice(0, 4),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "compare") {
      // Format attendu :
      // LEFT: Label gauche
      // - item 1
      // - item 2
      //
      // RIGHT: Label droit
      // - item a
      // - item b
      const leftMatch = fullText.match(/(?:LEFT|GAUCHE|BAD|AVANT)\s*[:：]\s*([^\n]+)\n((?:[-*•][^\n]+\n?)+)/i);
      const rightMatch = fullText.match(/(?:RIGHT|DROITE|GOOD|APRÈS|APRES)\s*[:：]\s*([^\n]+)\n((?:[-*•][^\n]+\n?)+)/i);
      if (leftMatch && rightMatch) {
        slides.push({
          kind: "compare",
          title: cleanHeading,
          leftLabel: leftMatch[1].trim(),
          leftItems: leftMatch[2].split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).slice(0, 5),
          rightLabel: rightMatch[1].trim(),
          rightItems: rightMatch[2].split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).slice(0, 5),
        });
      } else {
        // Fallback — split au |
        const pipeSplit = fullText.split(/\n\s*\|\s*\n/);
        if (pipeSplit.length >= 2) {
          const parseHalf = (h: string) => {
            const lines = h.split("\n");
            const label = lines[0].replace(/^[#\s-]+/, "").trim() || "Colonne";
            const items = lines.slice(1).map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean).slice(0, 5);
            return { label, items };
          };
          const l = parseHalf(pipeSplit[0]);
          const r = parseHalf(pipeSplit[1]);
          slides.push({ kind: "compare", title: cleanHeading, leftLabel: l.label, leftItems: l.items, rightLabel: r.label, rightItems: r.items });
        } else {
          // last resort : content simple
          slides.push({ kind: "content", title: cleanHeading, body: fullText });
        }
      }
      continue;
    }

    if (kind === "flow") {
      // Format attendu : liste ordonnée "1. Label — caption" ou juste "1. Label"
      const lines = fullText.split("\n");
      const bodyLines: string[] = [];
      const steps: { label: string; caption?: string }[] = [];
      let inSteps = false;
      for (const l of lines) {
        const stepMatch = l.match(/^\s*\d+[.)]\s+(.+)$/);
        const bulletStep = l.match(/^\s*[-*•]\s+(.+)$/);
        const m = stepMatch ?? bulletStep;
        if (m) {
          inSteps = true;
          const parts = m[1].split(/\s+[—–-]\s+/, 2);
          steps.push({ label: parts[0].trim(), caption: parts[1]?.trim() });
        } else if (!inSteps && l.trim()) {
          bodyLines.push(l);
        }
      }
      slides.push({
        kind: "flow",
        title: cleanHeading,
        steps: steps.slice(0, 5),
        body: bodyLines.join(" ").trim() || undefined,
      });
      continue;
    }

    if (kind === "pillars") {
      // Format : ### Pilier N + description
      const matches = [...fullText.matchAll(/###\s+([^\n]+)\n((?:(?!###).+\n?)*)/g)];
      const pillars = matches.map((m) => ({
        title: m[1].trim(),
        description: m[2].trim().replace(/\s+/g, " ").slice(0, 240),
      })).slice(0, 6);
      if (pillars.length >= 2) {
        slides.push({ kind: "pillars", title: cleanHeading, pillars });
      } else {
        // Fallback : bullets comme piliers ("**Titre** : description")
        const fallback = fullText
          .split("\n")
          .map((l) => l.replace(/^[-*•]\s*/, ""))
          .filter(Boolean)
          .map((l) => {
            const boldMatch = l.match(/\*\*([^*]+)\*\*\s*[:：]\s*(.+)/);
            if (boldMatch) return { title: boldMatch[1].trim(), description: boldMatch[2].trim() };
            const colonMatch = l.match(/^([^:]+)[:：]\s*(.+)$/);
            if (colonMatch) return { title: colonMatch[1].trim(), description: colonMatch[2].trim() };
            return null;
          })
          .filter((x): x is { title: string; description: string } => !!x)
          .slice(0, 6);
        if (fallback.length >= 2) {
          slides.push({ kind: "pillars", title: cleanHeading, pillars: fallback });
        } else {
          slides.push({ kind: "content", title: cleanHeading, body: fullText });
        }
      }
      continue;
    }

    if (kind === "matrix") {
      // Format attendu :
      //   X: Prix | bas | haut
      //   Y: Écosystème | ouvert | fermé
      //   TL: Niche premium
      //   TR: Champion
      //   BL: Commodité
      //   BR: Challenger
      //   - Apple | 0.85, 0.9 | *
      //   - Samsung | 0.6, 0.35
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      let xAxis: { label: string; low: string; high: string } | undefined;
      let yAxis: { label: string; low: string; high: string } | undefined;
      const quadrants: { tl?: string; tr?: string; bl?: string; br?: string } = {};
      const bodyLines: string[] = [];
      const points: { label: string; x: number; y: number; highlight?: boolean }[] = [];

      for (const l of lines) {
        const axisM = l.match(/^(X|Y|X-AXIS|Y-AXIS)\s*[:：]\s*(.+)$/i);
        const quadM = l.match(/^(TL|TR|BL|BR|Q-TL|Q-TR|Q-BL|Q-BR)\s*[:：]\s*(.+)$/i);
        const pointM = l.replace(/^[-*•]\s*/, "").match(/^(.+?)\s*\|\s*([\d.]+)\s*,\s*([\d.]+)\s*(\|\s*\*)?\s*$/);
        if (axisM) {
          const parts = axisM[2].split("|").map((s) => s.trim());
          const axis = axisM[1].toUpperCase().startsWith("X") ? "x" : "y";
          const target = { label: parts[0] || "", low: parts[1] || "bas", high: parts[2] || "haut" };
          if (axis === "x") xAxis = target; else yAxis = target;
        } else if (quadM) {
          const key = quadM[1].toUpperCase().replace("Q-", "").toLowerCase() as "tl" | "tr" | "bl" | "br";
          quadrants[key] = quadM[2].trim();
        } else if (pointM) {
          const x = parseFloat(pointM[2]);
          const y = parseFloat(pointM[3]);
          if (!isNaN(x) && !isNaN(y)) {
            points.push({
              label: pointM[1].trim(),
              x,
              y,
              highlight: !!pointM[4],
            });
          }
        } else if (!points.length && !xAxis && !yAxis) {
          bodyLines.push(l);
        }
      }

      if (xAxis && yAxis && points.length >= 2) {
        slides.push({
          kind: "matrix",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          xAxis,
          yAxis,
          quadrants: Object.keys(quadrants).length ? quadrants : undefined,
          points: points.slice(0, 10),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "valuechain") {
      // Format :
      //   HUB: iPhone 17 | 232M unités vendues 2025
      //   - App Store | 30 % commission
      //   - iCloud | Stockage récurrent
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      let hub: { label: string; caption?: string } | undefined;
      const nodes: { label: string; caption?: string }[] = [];
      const bodyLines: string[] = [];
      for (const l of lines) {
        const hubM = l.match(/^(HUB|CENTRE|CENTER)\s*[:：]\s*(.+)$/i);
        const nodeM = l.replace(/^[-*•]\s*/, "").match(/^(.+?)(?:\s*\|\s*(.+))?$/);
        if (hubM) {
          const parts = hubM[2].split("|").map((s) => s.trim());
          hub = { label: parts[0], caption: parts[1] };
        } else if (/^[-*•]/.test(l) && nodeM) {
          nodes.push({ label: nodeM[1].trim(), caption: nodeM[2]?.trim() });
        } else if (!hub && !nodes.length) {
          bodyLines.push(l);
        }
      }
      if (hub && nodes.length >= 2) {
        slides.push({
          kind: "valuechain",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          hub,
          nodes: nodes.slice(0, 6),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "orgchart") {
      // Format :
      //   ROOT: Tim Cook | CEO 2011-2026 | Transition annoncée 20 avr. 2026
      //   - John Ternus | CEO dès oct. 2026 | VP hardware iPhone
      //   - Jeff Williams | Retrait | Legacy COO
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      let root: { label: string; role?: string; caption?: string } | undefined;
      const children: { label: string; role?: string; caption?: string }[] = [];
      const bodyLines: string[] = [];
      for (const l of lines) {
        const rootM = l.match(/^(ROOT|RACINE)\s*[:：]\s*(.+)$/i);
        const childRaw = l.replace(/^[-*•]\s*/, "");
        if (rootM) {
          const parts = rootM[2].split("|").map((s) => s.trim());
          root = { label: parts[0], role: parts[1], caption: parts[2] };
        } else if (/^[-*•]/.test(l)) {
          const parts = childRaw.split("|").map((s) => s.trim());
          if (parts[0]) children.push({ label: parts[0], role: parts[1], caption: parts[2] });
        } else if (!root && !children.length) {
          bodyLines.push(l);
        }
      }
      if (root && children.length >= 1) {
        slides.push({
          kind: "orgchart",
          title: cleanHeading,
          body: bodyLines.join(" ").trim() || undefined,
          root,
          children: children.slice(0, 4),
        });
      } else {
        slides.push({ kind: "content", title: cleanHeading, body: fullText });
      }
      continue;
    }

    if (kind === "thanks") {
      const lines = fullText.split(/\n/);
      // Resources = uniquement les lignes qui commencent par - ou * ou •
      const resources = lines
        .filter((l) => /^\s*[-*•]/.test(l))
        .map((l) => l.replace(/^\s*[-*•]\s*/, "").trim())
        .filter(Boolean);
      // Body = première ligne non-bullet non-vide
      const body = lines.find((l) => l.trim() && !/^\s*[-*•]/.test(l))?.trim();
      slides.push({
        kind: "thanks",
        title: cleanHeading.toLowerCase() || "merci",
        body,
        resources: resources.length ? resources : undefined,
      });
      continue;
    }

    // Default → content
    slides.push({
      kind: "content",
      title: cleanHeading,
      body: fullText || cleanHeading,
    });
  }

  // Auto-append thanks si pas présent et plus de 3 slides
  const hasThanks = slides.some((s) => s.kind === "thanks");
  if (!hasThanks && slides.length > 3) {
    slides.push({
      kind: "thanks",
      title: "merci",
      body: "Cette présentation a été générée automatiquement par la plateforme NAIOM.",
      resources: ["naiomagency.com"],
    });
  }

  return {
    title: deckTitle,
    brand: fmBrand ?? "NAIOM",
    date: fmDate,
    slides,
  };
}
