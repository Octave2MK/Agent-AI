import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { DELIVERABLE_FOLDERS } from "./paths";
import type { Deliverable, AgentSlug } from "./types";

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function prettifyPdfName(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/^\d{4}-\d{2}-\d{2}-Nonvi-Efa-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function listDeliverables(agentSlug: AgentSlug): Promise<Deliverable[]> {
  const folder = DELIVERABLE_FOLDERS[agentSlug];
  if (!folder) return [];
  try {
    const files = await fs.readdir(folder.abs);
    const relevant = files.filter(
      (f) => !f.startsWith(".") && (f.endsWith(".md") || f.endsWith(".pdf"))
    );
    const results = await Promise.all(
      relevant.map(async (filename) => {
        const absolutePath = path.join(folder.abs, filename);
        const stat = await fs.stat(absolutePath);

        if (filename.endsWith(".pdf")) {
          return {
            slug: filename.replace(/\.pdf$/i, ""),
            filename,
            title: prettifyPdfName(filename),
            folder: folder.rel,
            absolutePath,
            bytes: stat.size,
            modifiedAt: stat.mtime.toISOString(),
            frontmatter: { type: "pdf" },
          } satisfies Deliverable;
        }

        const raw = await fs.readFile(absolutePath, "utf-8");
        const parsed = matter(raw);
        const slug = filename.replace(/\.md$/, "");
        const title = extractTitle(parsed.content, filename);
        return {
          slug,
          filename,
          title,
          folder: folder.rel,
          absolutePath,
          bytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          frontmatter: parsed.data,
        } satisfies Deliverable;
      })
    );
    return results.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  } catch {
    return [];
  }
}

export async function getDeliverable(agentSlug: AgentSlug, slug: string): Promise<{ deliverable: Deliverable; content: string } | null> {
  const folder = DELIVERABLE_FOLDERS[agentSlug];
  if (!folder) return null;
  try {
    const absolutePath = path.join(folder.abs, `${slug}.md`);
    const stat = await fs.stat(absolutePath);
    const raw = await fs.readFile(absolutePath, "utf-8");
    const parsed = matter(raw);
    return {
      deliverable: {
        slug,
        filename: `${slug}.md`,
        title: extractTitle(parsed.content, `${slug}.md`),
        folder: folder.rel,
        absolutePath,
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        frontmatter: parsed.data,
      },
      content: parsed.content,
    };
  } catch {
    return null;
  }
}

export async function countDeliverables(agentSlug: AgentSlug): Promise<number> {
  const items = await listDeliverables(agentSlug);
  return items.length;
}

export async function listAllDeliverables(): Promise<(Deliverable & { agentSlug: AgentSlug })[]> {
  const slugs: AgentSlug[] = [
    "strategiste",
    "createur-contenu",
    "designer",
    "presentateur",
    "analyste",
    "gmail",
    "fireflies",
    "cv",
  ];
  const all = await Promise.all(
    slugs.map(async (slug) => {
      const items = await listDeliverables(slug);
      return items.map((it) => ({ ...it, agentSlug: slug }));
    })
  );
  return all.flat().sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
}
