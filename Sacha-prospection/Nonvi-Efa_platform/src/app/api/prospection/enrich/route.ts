import { readLeads, updateLead } from "@/lib/prospection/store";
import { verifyEmails } from "@/lib/prospection/verify";

export const runtime = "nodejs";
export const maxDuration = 60;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SOCIAL_RE = /https?:\/\/(?:www\.)?(?:linkedin\.com|instagram\.com|facebook\.com)\/[^\s"'<>)]+/g;

/**
 * POST /api/prospection/enrich — ÉTAPE 2 · ENRICHISSEMENT (Ciblé → Profilé)
 * body: { leadId }
 * Visite le site web du lead : emails, réseaux sociaux, description.
 */
export async function POST(req: Request) {
  try {
    const { leadId } = await req.json();
    const lead = (await readLeads()).find((l) => l.id === leadId);
    if (!lead) return Response.json({ error: "Lead introuvable" }, { status: 404 });
    if (!lead.website) {
      // pas de site : on marque quand même enrichi avec ce qu'on a (téléphone, avis)
      const updated = await updateLead(leadId, {
        status: "enrichi",
        enrichedAt: new Date().toISOString(),
        insights: `Pas de site web. ${lead.reviewsCount ?? 0} avis Google (${lead.rating ?? "?"}/5). Contact possible par téléphone${lead.phone ? ` (${lead.phone})` : ""}.`,
      });
      return Response.json({ success: true, lead: updated });
    }

    // récupère la page d'accueil (10 s max)
    const emails = new Set(lead.emails ?? []);
    const socials = new Set(lead.socials ?? []);
    let description = "";
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(lead.website, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Nonvi-Efa-Prospection/1.0)" },
      });
      clearTimeout(t);
      const html = await res.text();
      for (const m of html.match(EMAIL_RE) ?? []) {
        // filtre les faux positifs fréquents (assets, sentry…)
        if (!/\.(png|jpg|jpeg|svg|webp|gif|css|js)$/i.test(m) && !m.includes("sentry")) emails.add(m.toLowerCase());
      }
      for (const m of html.match(SOCIAL_RE) ?? []) socials.add(m);
      const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1];
      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
      description = [title?.trim(), metaDesc?.trim()].filter(Boolean).join(" — ");
    } catch {
      // site injoignable : on garde ce qu'on a
    }

    const insights = [
      description || null,
      lead.reviewsCount ? `${lead.reviewsCount} avis Google (${lead.rating ?? "?"}/5)` : null,
      emails.size ? `${emails.size} email(s) trouvé(s)` : "aucun email public trouvé",
    ]
      .filter(Boolean)
      .join(" · ");

    const emailList = [...emails].slice(0, 5);
    const emailVerified = emailList.length ? await verifyEmails(emailList) : false;
    const updated = await updateLead(leadId, {
      status: "enrichi",
      enrichedAt: new Date().toISOString(),
      emailVerified,
      emails: emailList,
      socials: [...socials].slice(0, 5),
      insights,
    });
    return Response.json({ success: true, lead: updated });
  } catch (err) {
    console.error("[prospection/enrich]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
