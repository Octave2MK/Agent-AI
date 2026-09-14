"use client";

/**
 * Pipeline IAcquisition™ de l'agent prospection (Sacha) — CRM Kanban.
 *
 * DÉTECTION (Apify) → ENRICHISSEMENT (site) → PERSONNALISATION (Claude)
 * → CONTACT (Gmail). Vue en 4 colonnes façon CRM ; clic sur un prospect →
 * fiche détaillée en panneau latéral avec tout ce qu'on sait + l'action
 * suivante expliquée AVANT de cliquer.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type LeadStatus = "detecte" | "enrichi" | "pret" | "contacte";

interface Lead {
  id: string;
  name: string;
  niche: string;
  ville: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  mapsUrl?: string;
  rating?: number;
  reviewsCount?: number;
  emails?: string[];
  emailVerified?: boolean;
  socials?: string[];
  insights?: string;
  status: LeadStatus;
  outreach?: { subject: string; email: string; linkedin: string };
  createdAt: string;
  enrichedAt?: string;
  contactedAt?: string;
}

const STAGES: {
  key: LeadStatus;
  n: number;
  label: string;
  sub: string;
  color: string;
  soft: string;
}[] = [
  { key: "detecte", n: 1, label: "Détection", sub: "Ciblé", color: "#5B4DEE", soft: "#EDEBFF" },
  { key: "enrichi", n: 2, label: "Enrichissement", sub: "Profilé", color: "#8B5CF6", soft: "#F1EBFE" },
  { key: "pret", n: 3, label: "Personnalisation", sub: "Prêt", color: "#F5411C", soft: "#FFEBE4" },
  { key: "contacte", n: 4, label: "Contact", sub: "Contacté", color: "#188A5C", soft: "#DFF6EA" },
];

/** Taille estimée d'après le volume d'avis Google (proxy honnête). */
function sizeBucket(reviews?: number): { key: "petite" | "moyenne" | "grande"; label: string } {
  const r = reviews ?? 0;
  if (r >= 300) return { key: "grande", label: "Grande" };
  if (r >= 50) return { key: "moyenne", label: "Moyenne" };
  return { key: "petite", label: "Petite" };
}

/** Ce que fait chaque action, expliqué avant le clic. */
const ACTION_HELP: Record<LeadStatus, { title: string; desc: string } | null> = {
  detecte: {
    title: "Enrichir ce prospect",
    desc: "Sacha visite son site web pour récupérer son adresse email, ses réseaux sociaux et comprendre son activité. Gratuit, ~10 secondes.",
  },
  enrichi: {
    title: "Personnaliser l'approche",
    desc: "Claude rédige un email + un message LinkedIn sur mesure, basés sur ce qu'on sait vraiment de ce prospect (avis, métier, ville). ~15 secondes.",
  },
  pret: {
    title: "Envoyer le message",
    desc: "Relisez l'email généré, choisissez l'adresse d'envoi, puis l'email part depuis votre Gmail. Le prospect passe en « Contacté ».",
  },
  contacte: null,
};

export function ProspectionStudio() {
  const [needsConfig, setNeedsConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);

  const [niche, setNiche] = useState("");
  const [ville, setVille] = useState("");
  const [max, setMax] = useState(10);
  const [detecting, setDetecting] = useState(false);

  const [busy, setBusy] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState("");
  // page courante par colonne (5 cartes par page)
  const [page, setPage] = useState<Record<LeadStatus, number>>({
    detecte: 0, enrichi: 0, pret: 0, contacte: 0,
  });
  const PER_PAGE = 5;

  // ---- filtres ----
  const [fSearch, setFSearch] = useState("");
  const [fNiche, setFNiche] = useState("");
  const [fVille, setFVille] = useState("");
  const [fEmail, setFEmail] = useState(""); // "" | "avec" | "verifie" | "sans"
  const [fSize, setFSize] = useState(""); // "" | "petite" | "moyenne" | "grande"
  const [fRating, setFRating] = useState(0); // note minimum

  const load = useCallback(async () => {
    const res = await fetch("/api/prospection/leads");
    const data = await res.json();
    if (data.leads) setLeads(data.leads);
    if (data.configured === false) setNeedsConfig(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(
    () => leads.find((l) => l.id === selectedId) ?? null,
    [leads, selectedId]
  );

  // valeurs distinctes pour peupler les listes déroulantes
  const niches = useMemo(() => [...new Set(leads.map((l) => l.niche))].sort(), [leads]);
  const villes = useMemo(() => [...new Set(leads.map((l) => l.ville))].sort(), [leads]);

  // application des filtres
  const filtered = useMemo(() => {
    const q = fSearch.trim().toLowerCase();
    return leads.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !(l.category ?? "").toLowerCase().includes(q)) return false;
      if (fNiche && l.niche !== fNiche) return false;
      if (fVille && l.ville !== fVille) return false;
      if (fSize && sizeBucket(l.reviewsCount).key !== fSize) return false;
      if (fRating && (l.rating ?? 0) < fRating) return false;
      const hasEmail = (l.emails?.length ?? 0) > 0;
      if (fEmail === "avec" && !hasEmail) return false;
      if (fEmail === "verifie" && !l.emailVerified) return false;
      if (fEmail === "sans" && hasEmail) return false;
      return true;
    });
  }, [leads, fSearch, fNiche, fVille, fSize, fRating, fEmail]);

  const activeFilters =
    (fSearch ? 1 : 0) + (fNiche ? 1 : 0) + (fVille ? 1 : 0) + (fEmail ? 1 : 0) + (fSize ? 1 : 0) + (fRating ? 1 : 0);
  function resetFilters() {
    setFSearch(""); setFNiche(""); setFVille(""); setFEmail(""); setFSize(""); setFRating(0);
  }

  async function detect() {
    if (!niche.trim() || !ville.trim()) {
      setError("Indiquez une niche et une ville (ex. « agences immobilières » à « Lyon »).");
      return;
    }
    setError(null);
    setDetecting(true);
    try {
      const res = await fetch("/api/prospection/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, ville, max }),
      });
      const data = await res.json();
      if (res.status === 412) { setNeedsConfig(true); return; }
      if (!res.ok) throw new Error(data.error ?? "Erreur de détection");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDetecting(false);
    }
  }

  async function act(lead: Lead, action: "enrich" | "personalize" | "contact", body?: object) {
    setError(null);
    setBusy((b) => ({ ...b, [lead.id]: action }));
    try {
      const res = await fetch(`/api/prospection/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, ...(body ?? {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      if (data.lead) setLeads((ls) => ls.map((l) => (l.id === lead.id ? data.lead : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy((b) => { const n = { ...b }; delete n[lead.id]; return n; });
    }
  }

  /** Avance tous les prospects d'une colonne d'un coup (enrichir tout / personnaliser tout). */
  async function advanceAll(status: LeadStatus, action: "enrich" | "personalize") {
    const targets = leads.filter((l) => l.status === status);
    for (const lead of targets) {
      await act(lead, action); // séquentiel = évite de surcharger
    }
  }

  async function removeLead(lead: Lead) {
    if (!window.confirm(`Supprimer « ${lead.name} » du pipeline ?`)) return;
    await fetch("/api/prospection/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    setLeads((ls) => ls.filter((l) => l.id !== lead.id));
    if (selectedId === lead.id) setSelectedId(null);
  }

  if (needsConfig) {
    return (
      <div className="althea-card p-10 text-center">
        <div className="text-[44px] mb-3">🕵️</div>
        <h3 className="bronx-name mb-2">Branchez Apify pour la détection</h3>
        <p className="text-[14px] text-[#5A5A5A] max-w-[480px] mx-auto leading-relaxed">
          La détection scrape Google Maps via Apify. Créez un token sur <b>console.apify.com</b>
          → Settings → API &amp; Integrations, puis :
        </p>
        <pre className="mt-4 mx-auto max-w-[420px] rounded-xl bg-[#191627] text-[#B9F0C5] text-left text-[13px] p-4">
APIFY_TOKEN=apify_api_...
        </pre>
        <p className="mt-3 text-[13px] text-[#8A8A8A]">
          dans <code className="bg-[#F7F6FC] px-1.5 py-0.5 rounded">naiom-platform/.env.local</code>, puis relancez le serveur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-[#F5411C]/40 bg-[#F5411C]/8 px-4 py-3 text-[13px] font-semibold text-[#C22F0D]">
          ⚠ {error}
        </div>
      )}

      {/* ============ DÉTECTION ============ */}
      <section className="althea-card p-5">
        <div className="mb-3 flex items-baseline gap-2.5 flex-wrap">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B4DEE] text-[12px] font-black text-white">1</span>
          <h3 className="bronx-name" style={{ fontSize: 17 }}>Trouver de nouveaux prospects</h3>
          <span className="text-[12px] text-[#8A8A8A]">— Sacha scanne Google Maps et remonte les entreprises de la niche (~1 à 3 min)</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Niche (ex. agences immobilières, dentistes, salles de sport…)"
            className="flex-1 rounded-xl border border-[#E4E1F5] px-4 py-2.5 text-[14px] outline-none focus:border-[#F5411C]"
          />
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ville (ex. Lyon)"
            className="sm:w-[170px] rounded-xl border border-[#E4E1F5] px-4 py-2.5 text-[14px] outline-none focus:border-[#F5411C]"
          />
          <select
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="rounded-xl border border-[#E4E1F5] px-3 py-2.5 text-[13px] font-semibold outline-none"
          >
            {[10, 25, 50, 100, 200, 300].map((n) => <option key={n} value={n}>{n} leads</option>)}
          </select>
          <button
            type="button"
            onClick={detect}
            disabled={detecting}
            className="bronx-cta-solid whitespace-nowrap disabled:opacity-50"
          >
            {detecting ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Détection…</>
            ) : (<>🕵️ Détecter</>)}
          </button>
        </div>
        {detecting && (
          <div className="mt-3 text-[12.5px] text-[#8A8A8A]">
            Apify parcourt Google Maps ({niche} à {ville}) — emails et réseaux inclus quand ils existent. Ne quittez pas la page.
          </div>
        )}
      </section>

      {/* ============ BARRE DE FILTRES ============ */}
      {leads.length > 0 && (
        <section className="althea-card p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
                <Icon name="Search" size={14} />
              </span>
              <input
                value={fSearch}
                onChange={(e) => setFSearch(e.target.value)}
                placeholder="Rechercher un nom, un secteur…"
                className="w-full rounded-full border border-[#E4E1F5] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:border-[#F5411C]"
              />
            </div>
            <FSelect value={fNiche} onChange={setFNiche} options={[["", "Tous secteurs"], ...niches.map((n) => [n, n] as [string, string])]} />
            <FSelect value={fVille} onChange={setFVille} options={[["", "Toutes villes"], ...villes.map((v) => [v, v] as [string, string])]} />
            <FSelect
              value={fEmail}
              onChange={setFEmail}
              options={[["", "Email : tous"], ["verifie", "✓ vérifié"], ["avec", "avec email"], ["sans", "sans email"]]}
            />
            <FSelect
              value={fSize}
              onChange={setFSize}
              options={[["", "Taille : toutes"], ["grande", "Grande"], ["moyenne", "Moyenne"], ["petite", "Petite"]]}
            />
            <FSelect
              value={String(fRating)}
              onChange={(v) => setFRating(Number(v))}
              options={[["0", "Note : toutes"], ["4.5", "≥ 4,5 ⭐"], ["4", "≥ 4 ⭐"], ["3.5", "≥ 3,5 ⭐"]]}
            />
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F5411C]/10 px-3 py-2 text-[12px] font-bold text-[#F5411C] hover:bg-[#F5411C]/15"
              >
                <Icon name="X" size={12} /> {activeFilters} filtre{activeFilters > 1 ? "s" : ""}
              </button>
            )}
          </div>
          <div className="mt-2 px-1 text-[12px] text-[#8A8A8A]">
            {filtered.length} prospect{filtered.length > 1 ? "s" : ""}
            {activeFilters > 0 && ` sur ${leads.length}`} · taille estimée d&apos;après le nombre d&apos;avis Google
          </div>
        </section>
      )}

      {/* ============ LE KANBAN ============ */}
      {leads.length === 0 ? (
        <div className="althea-card p-10 text-center text-[13.5px] text-[#8A8A8A]">
          Aucun prospect pour l&apos;instant — lancez votre première détection 👆
        </div>
      ) : (
        <div className={cn("grid gap-4", selected ? "lg:grid-cols-[1fr_380px]" : "")}>
          {/* colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {STAGES.map((stage) => {
              const col = filtered.filter((l) => l.status === stage.key);
              const pageCount = Math.max(1, Math.ceil(col.length / PER_PAGE));
              const cur = Math.min(page[stage.key], pageCount - 1);
              const visible = col.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);
              const setColPage = (p: number) => setPage((s) => ({ ...s, [stage.key]: p }));
              return (
                <div key={stage.key} className="rounded-2xl bg-[#F7F6FC] p-2.5 flex flex-col min-h-[120px]">
                  {/* en-tête colonne */}
                  <div className="flex items-center justify-between px-1.5 pb-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white"
                        style={{ background: stage.color }}
                      >
                        {stage.n}
                      </span>
                      <div>
                        <div className="text-[12.5px] font-black leading-none" style={{ color: stage.color }}>
                          {stage.label}
                        </div>
                        <div className="text-[10px] font-bold text-[#8A8A8A]">→ {stage.sub}</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-black" style={{ color: stage.color }}>
                      {col.length}
                    </span>
                  </div>

                  {/* action groupée */}
                  {stage.key === "detecte" && col.length > 0 && (
                    <BulkBtn label="Tout enrichir" onClick={() => advanceAll("detecte", "enrich")} />
                  )}
                  {stage.key === "enrichi" && col.length > 0 && (
                    <BulkBtn label="Tout personnaliser" onClick={() => advanceAll("enrichi", "personalize")} />
                  )}

                  {/* cartes (page courante) */}
                  <div className="flex flex-col gap-2 mt-1">
                    {col.length === 0 && (
                      <div className="px-2 py-4 text-center text-[11.5px] text-[#B8B5C4]">vide</div>
                    )}
                    {visible.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        stage={stage}
                        active={selectedId === lead.id}
                        busy={busy[lead.id]}
                        onOpen={() => { setSelectedId(lead.id); setSendTo(lead.emails?.[0] ?? ""); }}
                      />
                    ))}
                  </div>

                  {/* pagination de la colonne */}
                  {pageCount > 1 && (
                    <div className="mt-2 flex items-center justify-between px-0.5">
                      <button
                        type="button"
                        disabled={cur === 0}
                        onClick={() => setColPage(cur - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#5A5A5A] disabled:opacity-30 hover:text-[#F5411C]"
                      >
                        <Icon name="ChevronLeft" size={15} />
                      </button>
                      <span className="text-[11px] font-bold text-[#8A8A8A]">
                        {cur * PER_PAGE + 1}–{cur * PER_PAGE + visible.length} / {col.length}
                      </span>
                      <button
                        type="button"
                        disabled={cur >= pageCount - 1}
                        onClick={() => setColPage(cur + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#5A5A5A] disabled:opacity-30 hover:text-[#F5411C]"
                      >
                        <Icon name="ChevronRight" size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============ FICHE PROSPECT (panneau latéral) ============ */}
          {selected && (
            <LeadDetail
              lead={selected}
              busy={busy[selected.id]}
              sendTo={sendTo}
              setSendTo={setSendTo}
              onClose={() => setSelectedId(null)}
              onAct={act}
              onRemove={removeLead}
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ================= Carte de prospect (colonne Kanban) ================= */

function LeadCard({
  lead, stage, active, busy, onOpen,
}: {
  lead: Lead;
  stage: (typeof STAGES)[number];
  active: boolean;
  busy?: string;
  onOpen: () => void;
}) {
  const hasEmail = (lead.emails?.length ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl bg-white border text-left px-3 py-2.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
      style={{ borderColor: active ? stage.color : "#EEEDF6", boxShadow: active ? `0 0 0 2px ${stage.color}33` : undefined }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[13px] font-bold leading-tight line-clamp-2">{lead.name}</div>
        {busy && <span className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[#E4E1F5] border-t-[#F5411C]" />}
      </div>
      <div className="mt-1 text-[11px] text-[#8A8A8A] truncate">
        {lead.category ?? lead.niche} · {lead.ville}
      </div>
      {/* micro-signaux */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.rating != null && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FFF6E5] px-1.5 py-0.5 text-[10px] font-bold text-[#B47A24]">
            ⭐ {lead.rating}
          </span>
        )}
        <span className="rounded-full bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] font-bold text-[#4B5FC4]">
          {sizeBucket(lead.reviewsCount).label}
        </span>
        {lead.emailVerified ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#DFF6EA] px-1.5 py-0.5 text-[10px] font-bold text-[#188A5C]">
            <Icon name="BadgeCheck" size={11} /> vérifié
          </span>
        ) : hasEmail ? (
          <span className="rounded-full bg-[#FFF1E8] px-1.5 py-0.5 text-[10px] font-bold text-[#B5651B]">✉️ email</span>
        ) : (
          <span className="rounded-full bg-[#F1F0F7] px-1.5 py-0.5 text-[10px] font-bold text-[#9A96A8]">sans email</span>
        )}
      </div>
    </button>
  );
}

function BulkBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-1 w-full rounded-lg border border-dashed border-[#C9C6BE] bg-white/60 py-1.5 text-[11px] font-bold text-[#5A5A5A] hover:border-[#F5411C] hover:text-[#F5411C] transition-colors"
    >
      ⚡ {label}
    </button>
  );
}

/* ================= Fiche détaillée ================= */

function LeadDetail({
  lead, busy, sendTo, setSendTo, onClose, onAct, onRemove,
}: {
  lead: Lead;
  busy?: string;
  sendTo: string;
  setSendTo: (v: string) => void;
  onClose: () => void;
  onAct: (lead: Lead, action: "enrich" | "personalize" | "contact", body?: object) => void;
  onRemove: (lead: Lead) => void;
}) {
  const stage = STAGES.find((s) => s.key === lead.status)!;
  const help = ACTION_HELP[lead.status];

  return (
    <aside className="althea-card overflow-hidden self-start lg:sticky lg:top-24">
      {/* bandeau étape */}
      <div className="px-5 py-3.5 flex items-center justify-between" style={{ background: stage.soft }}>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: stage.color }}>
            {stage.n}
          </span>
          <span className="text-[12px] font-black uppercase tracking-wider" style={{ color: stage.color }}>
            {stage.label} → {stage.sub}
          </span>
        </div>
        <button type="button" onClick={onClose} className="text-[#8A8A8A] hover:text-[#0F0F0F]">
          <Icon name="X" size={16} />
        </button>
      </div>

      <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* identité */}
        <div>
          <h3 className="bronx-name" style={{ fontSize: 18, lineHeight: 1.2 }}>{lead.name}</h3>
          <div className="mt-0.5 text-[12.5px] text-[#8A8A8A]">{lead.category ?? lead.niche} · {lead.ville}</div>
        </div>

        {/* fiche : ce qu'on sait */}
        <div className="rounded-xl bg-[#F7F6FC] p-3.5 space-y-2 text-[13px]">
          {lead.rating != null && (
            <InfoRow icon="Star" label="Réputation">
              {lead.rating}/5 · {lead.reviewsCount ?? 0} avis Google
            </InfoRow>
          )}
          <InfoRow icon="Building2" label="Taille estimée">
            {sizeBucket(lead.reviewsCount).label}{" "}
            <span className="text-[#A8A4B4]">(d&apos;après {lead.reviewsCount ?? 0} avis)</span>
          </InfoRow>
          {lead.phone && (
            <InfoRow icon="Phone" label="Téléphone">
              <a href={`tel:${lead.phone}`} className="hover:text-[#F5411C]">{lead.phone}</a>
            </InfoRow>
          )}
          {lead.website && (
            <InfoRow icon="Globe" label="Site web">
              <a href={lead.website} target="_blank" rel="noreferrer" className="text-[#5B4DEE] hover:underline break-all">
                {lead.website.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}
              </a>
            </InfoRow>
          )}
          {lead.address && <InfoRow icon="MapPin" label="Adresse">{lead.address}</InfoRow>}
          {(lead.emails?.length ?? 0) > 0 && (
            <InfoRow icon="Mail" label={lead.emailVerified ? "Emails · vérifié ✓" : "Emails"}>
              <div className="flex flex-col gap-0.5">
                {lead.emails!.map((e) => (
                  <span key={e} className="break-all inline-flex items-center gap-1">
                    {lead.emailVerified && <Icon name="BadgeCheck" size={12} className="text-[#188A5C] shrink-0" />}
                    {e}
                  </span>
                ))}
                {lead.emailVerified && (
                  <span className="text-[11px] text-[#188A5C]">domaine avec serveur mail actif</span>
                )}
              </div>
            </InfoRow>
          )}
          {(lead.socials?.length ?? 0) > 0 && (
            <InfoRow icon="Share2" label="Réseaux">
              <div className="flex flex-wrap gap-1.5">
                {lead.socials!.map((s) => {
                  const net = s.includes("linkedin") ? "LinkedIn" : s.includes("instagram") ? "Instagram" : "Facebook";
                  return (
                    <a key={s} href={s} target="_blank" rel="noreferrer"
                      className="rounded-full bg-white border border-[#E4E1F5] px-2 py-0.5 text-[11px] font-bold hover:border-[#F5411C]">
                      {net}
                    </a>
                  );
                })}
              </div>
            </InfoRow>
          )}
          {lead.mapsUrl && (
            <InfoRow icon="Map" label="Google Maps">
              <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="text-[#5B4DEE] hover:underline">Voir la fiche</a>
            </InfoRow>
          )}
        </div>

        {/* insights (après enrichissement) */}
        {lead.insights && (
          <div className="rounded-xl border border-[#EEEDF6] p-3.5">
            <div className="text-[10.5px] font-black uppercase tracking-wider text-[#8A8A8A] mb-1">🔎 Ce que Sacha a compris</div>
            <p className="text-[12.5px] leading-relaxed text-[#3A3A3A]">{lead.insights}</p>
          </div>
        )}

        {/* message généré (étape prêt / contacté) */}
        {lead.outreach && (
          <div className="space-y-3">
            <div>
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#8A8A8A] mb-1">✉️ Email — objet</div>
              <div className="text-[13px] font-bold mb-1.5">{lead.outreach.subject}</div>
              <div className="rounded-xl bg-[#F7F6FC] p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap">{lead.outreach.email}</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[10.5px] font-black uppercase tracking-wider text-[#8A8A8A]">💼 Message LinkedIn</div>
                <button type="button" onClick={() => navigator.clipboard.writeText(lead.outreach!.linkedin)}
                  className="text-[11px] font-bold text-[#5B4DEE] hover:underline inline-flex items-center gap-1">
                  <Icon name="Copy" size={11} /> Copier
                </button>
              </div>
              <div className="rounded-xl bg-[#F7F6FC] p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap">{lead.outreach.linkedin}</div>
            </div>
          </div>
        )}

        {/* ---- ACTION suivante, expliquée AVANT le clic ---- */}
        {help && (
          <div className="rounded-xl border-2 p-3.5" style={{ borderColor: stage.color, background: stage.soft }}>
            <div className="text-[13px] font-black mb-1" style={{ color: stage.color }}>
              Prochaine étape — {help.title}
            </div>
            <p className="text-[12px] leading-relaxed text-[#3A3A3A] mb-3">{help.desc}</p>

            {lead.status === "pret" ? (
              <div className="space-y-2">
                <input
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="destinataire@entreprise.fr"
                  className="w-full rounded-lg border border-[#E4E1F5] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#F5411C]"
                />
                <button
                  type="button"
                  disabled={busy === "contact" || !sendTo.trim()}
                  onClick={() => onAct(lead, "contact", { to: sendTo.trim() })}
                  className="bronx-cta-solid w-full justify-center text-[13px] disabled:opacity-50"
                >
                  {busy === "contact" ? "Envoi…" : "📤 Envoyer via Gmail"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => onAct(lead, lead.status === "detecte" ? "enrich" : "personalize")}
                className="bronx-cta-solid w-full justify-center text-[13px] disabled:opacity-50"
              >
                {busy ? "En cours…" : lead.status === "detecte" ? "🔎 Enrichir" : "✨ Personnaliser"}
              </button>
            )}
          </div>
        )}

        {lead.status === "contacte" && (
          <div className="rounded-xl bg-[#DFF6EA] p-3.5 text-center">
            <div className="text-[13px] font-black text-[#188A5C]">✓ Prospect contacté</div>
            {lead.contactedAt && (
              <div className="text-[11px] text-[#5A8B72] mt-0.5">
                Email envoyé le {new Date(lead.contactedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => onRemove(lead)}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-[12px] font-bold text-[#B8B5C4] hover:text-[#F5411C] transition-colors"
        >
          <Icon name="Trash2" size={13} /> Retirer du pipeline
        </button>
      </div>
    </aside>
  );
}

function FSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-full border bg-white px-3 py-2 text-[12.5px] font-semibold outline-none focus:border-[#F5411C]",
        value ? "border-[#F5411C] text-[#F5411C]" : "border-[#E4E1F5] text-[#3A3A3A]"
      )}
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}

function InfoRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Icon name={icon} size={14} className="mt-0.5 shrink-0 text-[#8A8A8A]" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#A8A4B4]">{label}</div>
        <div className="text-[12.5px] text-[#3A3A3A]">{children}</div>
      </div>
    </div>
  );
}
