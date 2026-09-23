"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */
interface ClientInfo { id: string; name: string; email: string; category: string; number: string }
interface Relance {
  id: string; number: string; ttc: number; status: "Paid" | "Unpaid" | "Overdue";
  dueDate: string | null; daysOverdue: number | null; client: ClientInfo | null;
  relance: { level: number; label: string; tone: "amber" | "orange" | "red" };
}
interface RelancesData {
  configured: boolean; base: string;
  kpis?: { encaisse: number; enAttente: number; enRetard: number; nbClients: number; nbFactures: number; nbImpayees: number; nbRetard: number };
  relances?: Relance[]; aFacturer?: Omit<Relance, "relance">[]; error?: string;
}
interface FinData {
  configured: boolean;
  kpis?: { ca: number; depenses: number; marge: number };
  byCategory?: { revenus: { name: string; total: number }[]; depenses: { name: string; total: number }[] };
  monthly?: { month: string; ca: number; dep: number }[];
}
interface Draft { invoiceId: string; number: string; ttc: number; status: string; clientName: string; downloadUrl: string; to: string; subject: string; body: string; markPaid: boolean }

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const eur2 = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);

const TONE: Record<string, { bar: string; chip: string; text: string }> = {
  amber: { bar: "bg-amber-400", chip: "bg-amber-100 text-amber-700", text: "text-amber-600" },
  orange: { bar: "bg-orange-400", chip: "bg-orange-100 text-orange-700", text: "text-orange-600" },
  red: { bar: "bg-rose-500", chip: "bg-rose-100 text-rose-700", text: "text-rose-600" },
};

export function ComptaStudio() {
  const [tab, setTab] = useState<"relances" | "finances">("relances");
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-ink)]">Compta — relances & facturation</h2>
          <p className="text-[13px] text-[var(--color-muted)]">Clients à relancer, factures en un clic, rapport quotidien à approuver.</p>
        </div>
        <div className="flex rounded-xl border border-[var(--color-line)] p-0.5 text-[12px] font-bold">
          {(["relances", "finances"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("rounded-lg px-3 py-1.5 transition", tab === t ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]")}>
              {t === "relances" ? "Relances" : "Finances"}
            </button>
          ))}
        </div>
      </div>
      {tab === "relances" ? <RelancesView /> : <FinancesView />}
    </div>
  );
}

/* ================= RELANCES ================= */
function RelancesView() {
  const [data, setData] = useState<RelancesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await (await fetch("/api/compta/relances", { cache: "no-store" })).json()); }
    catch { setData({ configured: false, base: "" }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <Skeleton />;
  if (!data?.configured) return <ConnectCard base={data?.base} />;
  if (data.error) return <div className="althea-card border-red-300 p-4 text-[13px] text-red-600">Airtable : {data.error}</div>;

  const k = data.kpis!;
  const relances = data.relances ?? [];
  const paid = data.aFacturer ?? [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Encaissé" value={eur(k.encaisse)} sub={`${k.nbFactures - k.nbImpayees} factures payées`} icon="CheckCircle2" tone="emerald" />
        <Kpi label="En attente" value={eur(k.enAttente)} sub={`${k.nbImpayees} impayées`} icon="Clock" tone="amber" />
        <Kpi label="En retard" value={eur(k.enRetard)} sub={`${k.nbRetard} factures`} icon="AlertTriangle" tone="rose" />
      </div>

      {/* rapport du jour */}
      <div className="althea-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "linear-gradient(90deg,#F5411C,#7A1E0C)" }}>
          <div className="flex items-center gap-2 text-[13px] font-black text-white"><Icon name="Sun" size={15} /> Rapport du jour — à relancer</div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">{relances.length}</span>
        </div>
        {relances.length === 0 ? (
          <div className="p-5 text-[13px] text-[var(--color-muted)]">Tout est à jour, rien à relancer. 🎉</div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {relances.map((r) => <RelanceRow key={r.id} r={r} onPrepare={() => void prepare(r.id, setDraft)} />)}
          </div>
        )}
      </div>

      {/* factures payées → confirmer / facture auto */}
      {paid.length > 0 && (
        <div className="althea-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-2.5 text-[13px] font-black text-[var(--color-ink)]">
            <Icon name="ReceiptText" size={15} /> Factures payées — envoyer l'acquittée
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {paid.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-[var(--color-ink)] truncate">{r.client?.name ?? "Client"} · {r.number}</div>
                  <div className="text-[11px] text-[var(--color-muted)]">{r.client?.email}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[13px] font-black tabular-nums text-emerald-600">{eur(r.ttc)}</span>
                  <button onClick={() => void prepare(r.id, setDraft)} className="rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-[12px] font-bold hover:bg-white/60">Envoyer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-2.5 py-1.5 text-[12px] font-bold hover:bg-white/60"><Icon name="RefreshCw" size={12} /> Actualiser</button>
      </div>

      {draft && <DraftModal draft={draft} onClose={() => setDraft(null)} onSent={() => { setDraft(null); void load(); }} />}
    </div>
  );
}

async function prepare(invoiceId: string, setDraft: (d: Draft) => void) {
  try {
    const res = await fetch("/api/compta/facture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoiceId }) });
    const d = await res.json();
    if (d.error) { alert(d.error); return; }
    setDraft({
      invoiceId, number: d.invoice.number, ttc: d.invoice.ttc, status: d.invoice.status,
      clientName: d.invoice.client?.name ?? "Client", downloadUrl: d.downloadUrl,
      to: d.email.to, subject: d.email.subject, body: d.email.body, markPaid: false,
    });
  } catch { alert("Erreur lors de la préparation de la facture."); }
}

function RelanceRow({ r, onPrepare }: { r: Relance; onPrepare: () => void }) {
  const t = TONE[r.relance.tone];
  const late = r.daysOverdue ?? 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={cn("h-9 w-1 rounded-full", t.bar)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black text-[var(--color-ink)] truncate">{r.client?.name ?? "Client"}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", t.chip)}>{r.relance.label}</span>
        </div>
        <div className="text-[11px] text-[var(--color-muted)]">{r.number} · {r.client?.email} {late > 0 && <span className={t.text}>· {late} j de retard</span>}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[14px] font-black tabular-nums text-[var(--color-ink)]">{eur(r.ttc)}</div>
      </div>
      <button onClick={onPrepare} className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90" style={{ background: "#F5411C" }}>
        <Icon name="Send" size={12} /> Préparer
      </button>
    </div>
  );
}

function DraftModal({ draft, onClose, onSent }: { draft: Draft; onClose: () => void; onSent: () => void }) {
  const [d, setD] = useState(draft);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const isPaid = draft.status === "Paid";

  const send = async () => {
    if (!d.to) { alert("Email destinataire manquant."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/compta/relance/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: d.invoiceId, to: d.to, subject: d.subject, message: d.body, markPaid: d.markPaid }),
      });
      const j = await res.json();
      if (j.error) { alert(j.error); setSending(false); return; }
      setDone("Envoyé ✓"); setTimeout(onSent, 900);
    } catch { alert("Erreur d'envoi."); setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--color-bg)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
          <div className="text-[14px] font-black text-[var(--color-ink)]">{isPaid ? "Envoyer la facture" : "Relance"} · {d.number} — {d.clientName}</div>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><Icon name="X" size={18} /></button>
        </div>
        <div className="grid flex-1 gap-0 overflow-hidden md:grid-cols-[1fr_1.1fr]">
          <div className="hidden border-r border-[var(--color-line)] bg-black/[0.03] md:block">
            <iframe src={d.downloadUrl} title="Facture" className="h-full w-full" />
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto p-5">
            <Field label="À"><input value={d.to} onChange={(e) => setD({ ...d, to: e.target.value })} className="input" /></Field>
            <Field label="Objet"><input value={d.subject} onChange={(e) => setD({ ...d, subject: e.target.value })} className="input" /></Field>
            <Field label="Message"><textarea value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} rows={9} className="input resize-none" /></Field>
            {!isPaid && (
              <label className="flex items-center gap-2 text-[12px] text-[var(--color-ink)]">
                <input type="checkbox" checked={d.markPaid} onChange={(e) => setD({ ...d, markPaid: e.target.checked })} />
                Marquer comme payée dans Airtable (facture acquittée)
              </label>
            )}
            <a href={d.downloadUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-[var(--color-accent,#F5411C)] md:hidden">Voir la facture PDF ↗</a>
            <div className="mt-1 flex items-center justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-[var(--color-line)] px-3 py-2 text-[13px] font-bold">Annuler</button>
              <button onClick={send} disabled={sending || !!done} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-black text-white disabled:opacity-60">
                {done ?? (sending ? "Envoi…" : <><Icon name="Check" size={14} /> Approuver & envoyer</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`.input{width:100%;border:1px solid var(--color-line);border-radius:10px;padding:9px 11px;font-size:13px;background:var(--color-bg);color:var(--color-ink)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="mb-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]">{label}</div>{children}</div>;
}

/* ================= FINANCES ================= */
function FinancesView() {
  const [data, setData] = useState<FinData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setData(await (await fetch("/api/compta", { cache: "no-store" })).json()); } catch { setData(null); } finally { setLoading(false); } })(); }, []);
  if (loading) return <Skeleton />;
  if (!data?.configured || !data.kpis) return <div className="althea-card p-5 text-[13px] text-[var(--color-muted)]">Base finances non connectée.</div>;
  const k = data.kpis;
  const rev = data.byCategory?.revenus ?? [];
  const dep = data.byCategory?.depenses ?? [];
  const maxR = Math.max(1, ...rev.map((r) => r.total)), maxD = Math.max(1, ...dep.map((r) => r.total));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Chiffre d'affaires" value={eur(k.ca)} sub="revenus" icon="TrendingUp" tone="emerald" />
        <Kpi label="Dépenses" value={eur(k.depenses)} sub="sorties" icon="TrendingDown" tone="rose" />
        <Kpi label="Marge nette" value={eur(k.marge)} sub={k.marge >= 0 ? "positif" : "négatif"} icon="Wallet" tone={k.marge >= 0 ? "emerald" : "rose"} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniBars title="Revenus par catégorie" rows={rev} max={maxR} tone="bg-emerald-400" />
        <MiniBars title="Dépenses par catégorie" rows={dep} max={maxD} tone="bg-rose-400" />
      </div>
    </div>
  );
}
function MiniBars({ title, rows, max, tone }: { title: string; rows: { name: string; total: number }[]; max: number; tone: string }) {
  return (
    <div className="althea-card p-4">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">{title}</div>
      <div className="space-y-2">
        {rows.slice(0, 6).map((r) => (
          <div key={r.name}>
            <div className="flex justify-between text-[12px]"><span className="truncate pr-2 text-[var(--color-ink)]">{r.name}</span><span className="font-black tabular-nums">{eur(r.total)}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-black/5"><div className={cn("h-full rounded-full", tone)} style={{ width: `${(Math.abs(r.total) / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= shared ================= */
const KPI_TONE: Record<string, { card: string; chip: string; val: string; label: string }> = {
  emerald: { card: "bg-emerald-50 border-emerald-200/70", chip: "bg-emerald-500 text-white", val: "text-emerald-700", label: "text-emerald-700/70" },
  amber: { card: "bg-amber-50 border-amber-200/70", chip: "bg-amber-500 text-white", val: "text-amber-700", label: "text-amber-700/70" },
  rose: { card: "bg-rose-50 border-rose-200/70", chip: "bg-rose-500 text-white", val: "text-rose-700", label: "text-rose-700/70" },
};
function Kpi({ label, value, sub, icon, tone }: { label: string; value: string; sub: string; icon: string; tone: "emerald" | "rose" | "amber" }) {
  const t = KPI_TONE[tone];
  return (
    <div className={cn("rounded-2xl border p-4", t.card)}>
      <div className="flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", t.chip)}><Icon name={icon} size={14} /></span>
        <span className={cn("text-[10px] font-black uppercase tracking-[0.12em]", t.label)}>{label}</span>
      </div>
      <div className={cn("mt-2 text-[26px] font-black leading-none tracking-tight tabular-nums", t.val)}>{value}</div>
      <div className={cn("mt-1 text-[11px] font-semibold", t.label)}>{sub}</div>
    </div>
  );
}
function Skeleton() { return <div className="althea-card p-6 text-[13px] text-[var(--color-muted)]">Chargement…</div>; }
function ConnectCard({ base }: { base?: string }) {
  return (
    <div className="althea-card p-5">
      <div className="flex items-center gap-2 text-[13px] font-black text-[var(--color-ink)]"><Icon name="Plug" size={15} /> Connecte Airtable</div>
      <ol className="mt-3 space-y-1.5 pl-5 text-[13px] text-[var(--color-ink-soft)] list-decimal">
        <li>Personal Access Token avec <code>data.records:read/write</code> + <code>schema.bases:read</code>.</li>
        <li><code>AIRTABLE_TOKEN=…</code> dans <code>.env.local</code>, puis relance <code>npm run dev</code>.</li>
        <li>Base clients : <code>{base}</code></li>
      </ol>
    </div>
  );
}
