import { isAirtableConfigured, listTables, getRecords, AIRTABLE_BASE, type AirtableRecord } from "@/lib/integrations/airtable";

export const runtime = "nodejs";
export const maxDuration = 60;

const REVENUE = /revenu|vente|encaiss|recette/i;
const EXPENSE = /d[ée]pense|charge|achat|frais|co[uû]t/i;
const AMOUNT = /montant|amount|prix|solde|co[uû]t|total|ttc|\bht\b/i;
const YEARLY = /ann[ée]e|year/i;
const DATE = /date/i;
const CATEG = /cat[ée]gorie/i;

const numOf = (v: unknown) => (typeof v === "number" ? v : 0);

/** Champ « montant » d'une table : priorité au champ nommé Montant, sinon le
 *  numérique dominant en excluant les années. */
function amountField(records: AirtableRecord[]): string | null {
  const numeric = new Map<string, number>();
  for (const r of records) {
    for (const [k, v] of Object.entries(r.fields)) {
      if (typeof v === "number") numeric.set(k, (numeric.get(k) ?? 0) + v);
    }
  }
  const named = [...numeric.keys()].find((k) => AMOUNT.test(k) && !YEARLY.test(k));
  if (named) return named;
  const candidates = [...numeric.entries()].filter(([k]) => !YEARLY.test(k));
  candidates.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  return candidates[0]?.[0] ?? null;
}

function categoryValue(rec: AirtableRecord, field: string, idToName: Map<string, string>): string {
  const v = rec.fields[field];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v.map((x) => (typeof x === "string" ? idToName.get(x) ?? x : String(x))).join(", ") || "—";
  }
  return "—";
}

function monthKey(rec: AirtableRecord, dateField: string | null): string | null {
  if (!dateField) return null;
  const v = rec.fields[dateField];
  if (typeof v === "string" && /^\d{4}-\d{2}/.test(v)) return v.slice(0, 7);
  return null;
}

export async function GET() {
  if (!isAirtableConfigured()) return Response.json({ configured: false, base: AIRTABLE_BASE });
  try {
    const tables = await listTables();
    const byName = (re: RegExp) => tables.find((t) => re.test(t.name));
    const tRev = byName(/^revenus?$/i) ?? byName(REVENUE);
    const tDep = byName(/^d[ée]penses?$/i) ?? byName(EXPENSE);
    const tCat = byName(CATEG);
    const tRap = byName(/rapport/i);

    const [rev, dep, cats, raps] = await Promise.all([
      tRev ? getRecords(tRev.id) : Promise.resolve([]),
      tDep ? getRecords(tDep.id) : Promise.resolve([]),
      tCat ? getRecords(tCat.id) : Promise.resolve([]),
      tRap ? getRecords(tRap.id) : Promise.resolve([]),
    ]);

    // map id → nom de catégorie (pour résoudre les liens)
    const catNameField = tCat?.fields.find((f) => /nom/i.test(f.name))?.name ?? "Name";
    const idToName = new Map<string, string>();
    for (const c of cats) {
      const n = c.fields[catNameField];
      if (typeof n === "string") idToName.set(c.id, n);
    }

    const revAmt = amountField(rev);
    const depAmt = amountField(dep);
    const ca = revAmt ? rev.reduce((t, r) => t + numOf(r.fields[revAmt]), 0) : 0;
    const depenses = depAmt ? dep.reduce((t, r) => t + numOf(r.fields[depAmt]), 0) : 0;

    // répartition par catégorie
    const groupByCat = (recs: AirtableRecord[], amt: string | null, catField: string | null) => {
      if (!amt || !catField) return [];
      const m = new Map<string, number>();
      for (const r of recs) {
        const cat = categoryValue(r, catField, idToName);
        m.set(cat, (m.get(cat) ?? 0) + numOf(r.fields[amt]));
      }
      return [...m.entries()].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
    };
    const revCatField = tRev?.fields.find((f) => CATEG.test(f.name))?.name ?? null;
    const depCatField = tDep?.fields.find((f) => CATEG.test(f.name))?.name ?? null;

    // évolution mensuelle
    const revDate = tRev?.fields.find((f) => DATE.test(f.name))?.name ?? null;
    const depDate = tDep?.fields.find((f) => DATE.test(f.name))?.name ?? null;
    const months = new Map<string, { ca: number; dep: number }>();
    for (const r of rev) {
      const mk = monthKey(r, revDate); if (!mk) continue;
      const e = months.get(mk) ?? { ca: 0, dep: 0 }; e.ca += numOf(r.fields[revAmt!]); months.set(mk, e);
    }
    for (const r of dep) {
      const mk = monthKey(r, depDate); if (!mk) continue;
      const e = months.get(mk) ?? { ca: 0, dep: 0 }; e.dep += numOf(r.fields[depAmt!]); months.set(mk, e);
    }
    const monthly = [...months.entries()].sort().map(([month, v]) => ({ month, ...v }));

    // rapports existants
    const reports = raps.map((r) => ({
      name: String(r.fields["Nom du Rapport"] ?? r.fields["Name"] ?? "Rapport"),
      debut: r.fields["Période de Début"] ?? null,
      fin: r.fields["Période de Fin"] ?? null,
      totalRev: numOf(r.fields["Total Revenus"]),
      totalDep: numOf(r.fields["Total Dépenses"]),
      solde: numOf(r.fields["Solde Net"]),
    }));

    return Response.json({
      configured: true,
      base: AIRTABLE_BASE,
      kpis: { ca, depenses, marge: ca - depenses, nbRevenus: rev.length, nbDepenses: dep.length },
      byCategory: { revenus: groupByCat(rev, revAmt, revCatField), depenses: groupByCat(dep, depAmt, depCatField) },
      monthly,
      reports,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json({ configured: true, error: err instanceof Error ? err.message : "Erreur Airtable" }, { status: 500 });
  }
}
