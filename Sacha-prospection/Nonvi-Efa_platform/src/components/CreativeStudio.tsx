"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/* ---------- types ---------- */
interface BrandKit { name: string; logoDataUrl: string | null; palette: string[]; font: string; univers: string; notes: string }
interface Creative {
  id: string; idea: string; format: string; prompt: string; status: "pending" | "done" | "error";
  imageUrl: string | null; thumbUrl: string | null; error?: string; createdAt: string;
  schedule?: { platform: string; at: string; status: string } | null;
}
interface Data { configured: boolean; brandKit: BrandKit; creatives: Creative[] }

const FORMATS = [
  { key: "1:1", label: "Post 1:1" }, { key: "4:5", label: "Portrait 4:5" },
  { key: "9:16", label: "Story 9:16" }, { key: "16:9", label: "Bannière 16:9" },
];
const FONTS = ["Archivo", "Inter", "Playfair Display", "Space Grotesk", "Poppins", "Montserrat", "DM Sans", "Fraunces"];
const UNIVERS = ["Minimaliste premium", "Éditorial luxe", "Tech / futuriste", "Organique / naturel", "Vibrant / pop", "Corporate épuré", "Rétro / vintage", "Sombre / dramatique"];
const PLATFORMS = ["Instagram", "LinkedIn", "TikTok", "Facebook", "X"];

export function CreativeStudio() {
  const [tab, setTab] = useState<"identite" | "creer" | "resultats">("creer");
  const [data, setData] = useState<Data | null>(null);
  const load = useCallback(async () => {
    try { setData(await (await fetch("/api/creative/list", { cache: "no-store" })).json()); } catch { /* */ }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-ink)]">Studio créa — Mia</h2>
          <p className="text-[13px] text-[var(--color-muted)]">Ton identité → un prompt Higgsfield → tes créatives, prêtes à programmer.</p>
        </div>
        <div className="flex rounded-xl border border-[var(--color-line)] p-0.5 text-[12px] font-bold">
          {([["identite", "Identité"], ["creer", "Créer"], ["resultats", "Résultats"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={cn("rounded-lg px-3 py-1.5 transition", tab === k ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]")}>
              {l}{k === "resultats" && data?.creatives.length ? ` (${data.creatives.length})` : ""}
            </button>
          ))}
        </div>
      </div>
      {!data ? <Skeleton /> : tab === "identite" ? (
        <IdentiteTab brandKit={data.brandKit} onSaved={load} />
      ) : tab === "creer" ? (
        <CreerTab configured={data.configured} onGenerated={() => { void load(); setTab("resultats"); }} />
      ) : (
        <ResultatsTab creatives={data.creatives} onChange={load} />
      )}
    </div>
  );
}

/* ================= IDENTITÉ ================= */
function IdentiteTab({ brandKit, onSaved }: { brandKit: BrandKit; onSaved: () => void }) {
  const [bk, setBk] = useState<BrandKit>(brandKit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickLogo = (f: File) => {
    const r = new FileReader();
    r.onload = () => setBk({ ...bk, logoDataUrl: String(r.result) });
    r.readAsDataURL(f);
  };
  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch("/api/creative/brandkit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bk) });
      const j = await res.json();
      if (j.error) { alert(j.error); } else { setSaved(true); onSaved(); }
    } finally { setSaving(false); }
  };
  const setColor = (i: number, v: string) => { const p = [...bk.palette]; p[i] = v; setBk({ ...bk, palette: p }); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* logo + nom */}
        <div className="althea-card p-4">
          <Label>Logo & marque</Label>
          <div className="mt-3 flex items-center gap-4">
            <button onClick={() => fileRef.current?.click()} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[var(--color-line)] bg-white/50 hover:border-[var(--color-ink)]">
              {bk.logoDataUrl ? <img src={bk.logoDataUrl} alt="logo" className="h-full w-full object-contain p-1" /> : <Icon name="ImagePlus" size={22} className="text-[var(--color-muted)]" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && pickLogo(e.target.files[0])} />
            <div className="flex-1">
              <input value={bk.name} onChange={(e) => setBk({ ...bk, name: e.target.value })} placeholder="Nom de la marque" className="input" />
              {bk.logoDataUrl && <button onClick={() => setBk({ ...bk, logoDataUrl: null })} className="mt-1.5 text-[11px] font-bold text-rose-500">Retirer le logo</button>}
            </div>
          </div>
        </div>

        {/* palette */}
        <div className="althea-card p-4">
          <Label>Palette de couleurs</Label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {bk.palette.map((c, i) => (
              <div key={i} className="group relative">
                <input type="color" value={c} onChange={(e) => setColor(i, e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-[var(--color-line)] p-0" />
                <button onClick={() => setBk({ ...bk, palette: bk.palette.filter((_, j) => j !== i) })} className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white group-hover:flex">×</button>
              </div>
            ))}
            {bk.palette.length < 6 && <button onClick={() => setBk({ ...bk, palette: [...bk.palette, "#888888"] })} className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-line)] text-[var(--color-muted)]">+</button>}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">{bk.palette.map((c, i) => <span key={i} className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[10px]">{c}</span>)}</div>
        </div>

        {/* police */}
        <div className="althea-card p-4">
          <Label>Police</Label>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {FONTS.map((f) => (
              <button key={f} onClick={() => setBk({ ...bk, font: f })} className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold", bk.font === f ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:bg-white/60")}>{f}</button>
            ))}
          </div>
        </div>

        {/* univers */}
        <div className="althea-card p-4">
          <Label>Univers visuel</Label>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {UNIVERS.map((u) => (
              <button key={u} onClick={() => setBk({ ...bk, univers: u })} className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold", bk.univers === u ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:bg-white/60")}>{u}</button>
            ))}
          </div>
          <input value={bk.univers} onChange={(e) => setBk({ ...bk, univers: e.target.value })} placeholder="…ou décris ton univers" className="input mt-2" />
        </div>
      </div>

      <div className="althea-card p-4">
        <Label>Contraintes & éléments obligatoires</Label>
        <textarea value={bk.notes} onChange={(e) => setBk({ ...bk, notes: e.target.value })} rows={3} placeholder="Ex. logo en bas à droite, jamais de visage, ton chaleureux, éviter le bleu corporate…" className="input mt-2 resize-none" />
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-[12px] font-bold text-emerald-600">Identité enregistrée ✓</span>}
        <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-black text-white disabled:opacity-60">
          <Icon name="Save" size={14} /> {saving ? "Enregistrement…" : "Enregistrer l'identité"}
        </button>
      </div>
      <Style />
    </div>
  );
}

/* ================= CRÉER ================= */
function CreerTab({ configured, onGenerated }: { configured: boolean; onGenerated: () => void }) {
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState("1:1");
  const [prompt, setPrompt] = useState("");
  const [neg, setNeg] = useState("");
  const [phase, setPhase] = useState<"idle" | "formulating" | "ready" | "generating">("idle");

  const formulate = async () => {
    if (!idea.trim()) return;
    setPhase("formulating");
    try {
      const res = await fetch("/api/creative/prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, format }) });
      const j = await res.json();
      if (j.error) { alert(j.error); setPhase("idle"); return; }
      setPrompt(j.prompt); setNeg(j.negativePrompt); setPhase("ready");
    } catch { alert("Erreur formulation."); setPhase("idle"); }
  };
  const generate = async () => {
    setPhase("generating");
    try {
      const res = await fetch("/api/creative/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, format, prompt, negativePrompt: neg }) });
      const j = await res.json();
      if (j.error) { alert(j.error); setPhase("ready"); return; }
      setIdea(""); setPrompt(""); setNeg(""); setPhase("idle"); onGenerated();
    } catch { alert("Erreur génération."); setPhase("ready"); }
  };

  return (
    <div className="space-y-4">
      {!configured && (
        <div className="althea-card border-amber-300 bg-amber-50/50 p-3 text-[12px] text-amber-800">
          <b>Higgsfield non connecté.</b> Ajoute <code>HIGGSFIELD_API_KEY</code> + <code>HIGGSFIELD_SECRET</code> dans <code>.env.local</code> pour lancer les générations. Tu peux déjà formuler les prompts.
        </div>
      )}
      <div className="althea-card p-4">
        <Label>Ton idée</Label>
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="Ex. un visuel pour lancer notre offre d'automatisation IA, ambiance confiance et modernité, mise en avant du gain de temps" className="input mt-2 resize-none" />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-[var(--color-muted)]">Format :</span>
          {FORMATS.map((f) => (
            <button key={f.key} onClick={() => setFormat(f.key)} className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold", format === f.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:bg-white/60")}>{f.label}</button>
          ))}
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={formulate} disabled={!idea.trim() || phase === "formulating"} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink)] px-3.5 py-2 text-[13px] font-black text-[var(--color-ink)] disabled:opacity-50">
            <Icon name="Sparkles" size={14} /> {phase === "formulating" ? "Mia rédige…" : "Formuler le prompt"}
          </button>
        </div>
      </div>

      {(phase === "ready" || phase === "generating") && prompt && (
        <div className="althea-card p-4">
          <Label>Prompt Higgsfield (éditable)</Label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} className="input mt-2 resize-none font-mono text-[12px]" />
          <Label>Negative prompt</Label>
          <input value={neg} onChange={(e) => setNeg(e.target.value)} className="input mt-1 font-mono text-[12px]" />
          <div className="mt-3 flex items-center justify-between">
            <button onClick={() => navigator.clipboard.writeText(prompt)} className="text-[12px] font-bold text-[var(--color-muted)]">Copier le prompt</button>
            <button onClick={generate} disabled={phase === "generating" || !configured} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-black text-white disabled:opacity-60">
              <Icon name="Wand2" size={14} /> {phase === "generating" ? "Envoi à Higgsfield…" : "Générer la créative"}
            </button>
          </div>
        </div>
      )}
      <Style />
    </div>
  );
}

/* ================= RÉSULTATS ================= */
function ResultatsTab({ creatives, onChange }: { creatives: Creative[]; onChange: () => void }) {
  // poll les pending
  useEffect(() => {
    const pend = creatives.filter((c) => c.status === "pending");
    if (!pend.length) return;
    const t = setInterval(async () => {
      await Promise.all(pend.map((c) => fetch(`/api/creative/job/${c.id}`).catch(() => {})));
      onChange();
    }, 4000);
    return () => clearInterval(t);
  }, [creatives, onChange]);

  const [sched, setSched] = useState<Creative | null>(null);
  if (!creatives.length) return <div className="althea-card p-6 text-center text-[13px] text-[var(--color-muted)]">Aucune créative encore. Va dans <b>Créer</b> pour lancer la première. 🎨</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {creatives.map((c) => (
          <div key={c.id} className="althea-card overflow-hidden">
            <div className="relative aspect-square bg-black/5">
              {c.status === "done" && c.imageUrl ? (
                <img src={c.imageUrl} alt={c.idea} className="h-full w-full object-cover" />
              ) : c.status === "error" ? (
                <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-rose-500">{c.error ?? "Échec"}</div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
                  <Icon name="Loader" size={20} className="animate-spin" /><span className="text-[11px]">Génération…</span>
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">{c.format}</span>
              {c.schedule && <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">📅 {c.schedule.platform}</span>}
            </div>
            <div className="p-2.5">
              <p className="line-clamp-2 text-[11px] text-[var(--color-ink)]">{c.idea || c.prompt.slice(0, 80)}</p>
              {c.status === "done" && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => setSched(c)} className="flex-1 rounded-lg bg-[var(--color-ink)] px-2 py-1.5 text-[11px] font-bold text-white">{c.schedule ? "Reprogrammer" : "Programmer"}</button>
                  <a href={c.imageUrl!} target="_blank" rel="noreferrer" className="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-[11px] font-bold">↗</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {sched && <ScheduleModal creative={sched} onClose={() => setSched(null)} onSaved={() => { setSched(null); onChange(); }} />}
      <Style />
    </div>
  );
}

function ScheduleModal({ creative, onClose, onSaved }: { creative: Creative; onClose: () => void; onSaved: () => void }) {
  const [platform, setPlatform] = useState(creative.schedule?.platform ?? "Instagram");
  const [at, setAt] = useState(creative.schedule?.at ?? "");
  const [busy, setBusy] = useState(false);
  const save = async (clear = false) => {
    setBusy(true);
    try {
      await fetch("/api/creative/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(clear ? { id: creative.id } : { id: creative.id, platform, at }) });
      onSaved();
    } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg)] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><div className="text-[14px] font-black">Programmer la publication</div><button onClick={onClose}><Icon name="X" size={16} /></button></div>
        {creative.imageUrl && <img src={creative.imageUrl} alt="" className="mb-3 h-28 w-full rounded-lg object-cover" />}
        <Label>Réseau</Label>
        <div className="mb-3 mt-1.5 flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => <button key={p} onClick={() => setPlatform(p)} className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold", platform === p ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)]")}>{p}</button>)}
        </div>
        <Label>Date & heure</Label>
        <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="input mt-1.5" />
        <div className="mt-4 flex items-center justify-between gap-2">
          {creative.schedule ? <button onClick={() => save(true)} disabled={busy} className="text-[12px] font-bold text-rose-500">Déprogrammer</button> : <span />}
          <button onClick={() => save(false)} disabled={busy || !at} className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-black text-white disabled:opacity-60">{busy ? "…" : "Programmer"}</button>
        </div>
        <Style />
      </div>
    </div>
  );
}

/* ================= shared ================= */
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">{children}</div>;
}
function Skeleton() { return <div className="althea-card p-6 text-[13px] text-[var(--color-muted)]">Chargement…</div>; }
function Style() {
  return <style jsx>{`.input{width:100%;border:1px solid var(--color-line);border-radius:10px;padding:9px 11px;font-size:13px;background:var(--color-bg);color:var(--color-ink)}`}</style>;
}
