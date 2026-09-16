import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getAIModel, getAIProvider } from "@/lib/ai/provider";
import { readPosts, updatePost } from "@/lib/veille/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const post = (await readPosts()).find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Reel introuvable" }, { status: 404 });
  if (post.scriptStatus !== "ok" || !post.script?.trim()) return NextResponse.json({ error: "Transcris d'abord le script." }, { status: 400 });

  try {
    const { text } = await generateText({
      model: getAIModel("claude-sonnet-5"),
      maxOutputTokens: 4000,
      prompt: `Traduis en FRANÇAIS le script parlé de ce reel Instagram.

Règles :
- Traduction fidèle, naturelle, qui garde le TON PARLÉ (comme si la personne parlait en français).
- Ne résume pas, ne commente pas, n'ajoute rien. Garde la même structure de phrases.
- Si le texte est déjà en français, renvoie-le tel quel (corrige juste d'éventuelles fautes de transcription évidentes).
- Réponds UNIQUEMENT avec la traduction, sans préambule ni guillemets.

--- SCRIPT ---
${post.script.slice(0, 6000)}
--- FIN ---`,
    });
    const scriptFr = text.trim();
    if (!scriptFr) throw new Error("Traduction vide.");
    await updatePost(id, { scriptFr });
    return NextResponse.json({ ok: true, posts: await readPosts(), provider: getAIProvider() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Traduction impossible";
    return NextResponse.json({ error: message }, { status: /API_KEY absente/.test(message) ? 412 : 500 });
  }
}
