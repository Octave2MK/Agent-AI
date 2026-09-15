import { generateContent, type Platform, type Format, type ContentResult } from "@/lib/content/generate";
import { generateType1 } from "@/lib/content/type1";
import { addPost } from "@/lib/content/store";

export const runtime = "nodejs";
export const maxDuration = 90;

/** POST /api/content/generate { platform, format, idea, template?, refId?, tools? } → génère + enregistre. */
export async function POST(req: Request) {
  try {
    const { platform, format, idea, template, refId, tools } = (await req.json()) as {
      platform?: Platform; format?: Format; idea?: string; template?: string; refId?: string; tools?: string[];
    };
    if (!platform || !format || !idea?.trim())
      return Response.json({ error: "platform, format et idea requis" }, { status: 400 });

    // TOUS les carrousels Instagram → rendu HTML éducatif (JAMAIS Higgsfield)
    if (platform === "instagram" && format === "carousel") {
      const t1 = await generateType1(idea.trim(), tools ?? []);
      const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
      const result: ContentResult = {
        platform, format,
        slides: t1.slides.map((s) => ({ title: String(s.title ?? ""), body: s.sub ?? (arr(s.bullets).join(" · ") || "") })),
        caption: `${idea.trim()} 👇`,
        hashtags: [],
      };
      const post = await addPost({ platform, format, idea: idea.trim(), template, refId, tools, t1, result });
      return Response.json({ success: true, id: post.id, ...result });
    }

    const result = await generateContent(platform, format, idea.trim(), template);
    const post = await addPost({ platform, format, idea: idea.trim(), template, refId, tools, result });
    return Response.json({ success: true, id: post.id, ...result });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
