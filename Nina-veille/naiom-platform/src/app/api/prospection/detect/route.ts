import { apifyConfigured, detectLeads } from "@/lib/integrations/apify";
import { addLeads, type Lead } from "@/lib/prospection/store";
import { verifyEmails } from "@/lib/prospection/verify";

export const runtime = "nodejs";
export const maxDuration = 300; // le scraping Google Maps prend 1 à 3 min

/**
 * POST /api/prospection/detect — ÉTAPE 1 · DÉTECTION (Inconnu → Ciblé)
 * body: { niche: string, ville: string, max?: number }
 * Scrape Google Maps via Apify et ajoute les leads au pipeline.
 */
export async function POST(req: Request) {
  if (!apifyConfigured()) {
    return Response.json(
      {
        error:
          "Apify n'est pas configuré : ajoutez APIFY_TOKEN=... dans naiom-platform/.env.local (token gratuit sur console.apify.com → Settings → API & Integrations), puis relancez le serveur.",
        needsConfig: true,
      },
      { status: 412 }
    );
  }
  try {
    const { niche, ville, max } = await req.json();
    if (!niche?.trim() || !ville?.trim()) {
      return Response.json({ error: "Niche et ville requises." }, { status: 400 });
    }

    const places = await detectLeads({ niche: niche.trim(), ville: ville.trim(), max });

    const now = new Date().toISOString();
    const leads: Lead[] = await Promise.all(places
      .filter((p) => p.title)
      .map(async (p, i) => {
        const emails = (p.emails ?? []).filter(Boolean);
        const socials = [...(p.linkedIns ?? []), ...(p.instagrams ?? []), ...(p.facebooks ?? [])];
        const emailVerified = emails.length ? await verifyEmails(emails) : false;
        return {
          id: `lead-${Date.now()}-${i}`,
          name: p.title!,
          niche: niche.trim(),
          ville: ville.trim(),
          category: p.categoryName,
          address: p.address,
          phone: p.phone,
          website: p.website,
          mapsUrl: p.url,
          rating: p.totalScore,
          reviewsCount: p.reviewsCount,
          emails,
          emailVerified,
          socials,
          // si le scraper a déjà trouvé email + réseaux, le lead est enrichi d'office
          status: (emails.length > 0 ? "enrichi" : "detecte") as Lead["status"],
          createdAt: now,
        };
      }));

    const added = await addLeads(leads);
    return Response.json({ success: true, added: added.length, total: leads.length });
  } catch (err) {
    console.error("[prospection/detect]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
