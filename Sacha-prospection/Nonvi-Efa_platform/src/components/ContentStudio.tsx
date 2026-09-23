"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/* ============ types ============ */
type Platform = "instagram" | "linkedin" | "twitter";
type Format = "carousel" | "post" | "image" | "tweet" | "thread";
interface Slide { title: string; body: string }
interface Result {
  platform: Platform; format: Format;
  slides?: Slide[]; caption?: string; hashtags?: string[]; headline?: string; body?: string; tweets?: string[];
}
interface ContentPost {
  id: string;
  platform: Platform;
  format: Format;
  idea: string;
  template?: string;
  result: Result;
  visuals?: {
    jobs: { index: number; jobId: string }[];
    images: (string | null)[];
    done: boolean;
  };
  status: "draft" | "scheduled" | "posted";
  schedule?: { at: string } | null;
  createdAt: string;
}

/* ============ carousel templates (DA) ============ */
interface Tmpl { id: string; name: string; bg: string; fg: string; accent: string; sub: string; font: string }
const TEMPLATES: Tmpl[] = [
  { id: "minimal", name: "Minimal", bg: "#ffffff", fg: "#141414", accent: "#F5411C", sub: "#6b7280", font: "'Archivo',sans-serif" },
  { id: "bold", name: "Bold", bg: "#141414", fg: "#ffffff", accent: "#F5411C", sub: "#a7abb6", font: "'Archivo',sans-serif" },
  { id: "gradient", name: "Gradient", bg: "linear-gradient(135deg,#F5411C,#5B4DEE)", fg: "#ffffff", accent: "#ffffff", sub: "rgba(255,255,255,.8)", font: "'Archivo',sans-serif" },
  { id: "editorial", name: "Éditorial", bg: "#FAF6F4", fg: "#1a1a1a", accent: "#5B4DEE", sub: "#7a7a7a", font: "Georgia,'Times New Roman',serif" },
];

// Modèles de référence (images de Melyssa) servis depuis /public/templates
const REF_TEMPLATES: Record<Platform, { id: string; src: string }[]> = {
  linkedin: ["1", "2", "3", "4", "6", "7", "8", "9", "10", "13", "14", "15", "16"].map((n) => ({ id: `li-${n}`, src: `/templates/li/${n}.png` })),
  twitter: ["1", "2", "3", "4", "6", "7", "8", "9", "10", "13", "14", "15", "16"].map((n) => ({ id: `li-${n}`, src: `/templates/li/${n}.png` })),
  instagram: ["type1", "type2", "type3", "type4"].map((t) => ({ id: `ig-${t}`, src: `/templates/ig/${t}.png` })),
};

const tplByName = (n?: string) => TEMPLATES.find((t) => t.name === n) ?? TEMPLATES[0];

const FORMATS: Record<Platform, { key: Format; label: string }[]> = {
  instagram: [{ key: "carousel", label: "Carrousel" }, { key: "post", label: "Post (visuel)" }],
  linkedin: [{ key: "image", label: "Post visuel" }, { key: "carousel", label: "Carrousel" }, { key: "post", label: "Post texte" }],
  twitter: [{ key: "image", label: "Post visuel" }, { key: "tweet", label: "Tweet" }, { key: "thread", label: "Thread" }],
};

const PLAT = {
  instagram: { label: "Instagram", color: "#E1306C" },
  linkedin: { label: "LinkedIn", color: "#0A66C2" },
  twitter: { label: "X / Twitter", color: "#000000" },
} as const;

/* ============ network logos (inline svg) ============ */
const IgLogo = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><defs><linearGradient id="ig" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#feda75" /><stop offset=".4" stopColor="#fa7e1e" /><stop offset=".7" stopColor="#d62976" /><stop offset="1" stopColor="#962fbf" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" /><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" /><circle cx="17.2" cy="6.8" r="1.2" fill="#fff" /></svg>
);
const LiLogo = ({ s = 22 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><rect width="24" height="24" rx="4" fill="#0A66C2" /><path fill="#fff" d="M7 9.5H4.4V19H7V9.5ZM5.7 8.3a1.5 1.5 0 100-3 1.5 1.5 0 000 3ZM19.6 19h-2.6v-4.9c0-1.2-.4-2-1.5-2-.8 0-1.3.6-1.5 1.1-.1.2-.1.5-.1.7V19H11.3s.03-8.6 0-9.5h2.6v1.3c.3-.5 1-1.3 2.5-1.3 1.8 0 3.2 1.2 3.2 3.8V19Z" /></svg>
);
const XLogo = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M18.9 2H22l-7.3 8.3L23 22h-6.5l-5-6.6L5.7 22H2.5l7.8-8.9L1.7 2h6.7l4.6 6.1L18.9 2Zm-2.3 18h1.7L7.4 3.8H5.6L16.6 20Z" /></svg>
);

/* ============ main ============ */
export function ContentStudio() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [mode, setMode] = useState<"create" | "library">("create");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const reload = useCallback(async () => {
    try { const j = await (await fetch("/api/content/list", { cache: "no-store" })).json(); setPosts(j.posts ?? []); } catch { /* */ }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const latestFor = (p: Platform) => posts.find((x) => x.platform === p) ?? null;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--color-ink)]">Studio contenu — Léa</h2>
          <p className="text-[13px] text-[var(--color-muted)]">Crée du contenu adapté à chaque réseau et visualise le rendu final comme sur la plateforme.</p>
        </div>
        <div className="flex rounded-xl border border-[var(--color-line)] p-0.5 text-[12px] font-bold">
          {([["create", "Créer"], ["library", `Bibliothèque${posts.length ? ` (${posts.length})` : ""}`]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)}
              className={cn("rounded-lg px-3 py-1.5 transition", mode === k ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-ink)]")}>{l}</button>
          ))}
        </div>
      </div>

      {mode === "library" ? (
        <LibraryView posts={posts} onChange={reload} />
      ) : (
        <>
          <div className="flex gap-2">
            {(["instagram", "linkedin", "twitter"] as Platform[]).map((p) => {
              const active = platform === p;
              const Logo = p === "instagram" ? IgLogo : p === "linkedin" ? LiLogo : XLogo;
              return (
                <button key={p} onClick={() => setPlatform(p)}
                  className={cn("flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-bold transition",
                    active ? "border-transparent text-white" : "border-[var(--color-line)] text-[var(--color-ink)] hover:bg-white/60")}
                  style={active ? { background: PLAT[p].color } : undefined}>
                  <span className={cn(p === "twitter" && active && "text-white")}><Logo s={18} /></span> {PLAT[p].label}
                </button>
              );
            })}
          </div>
          <PlatformPanel key={`${platform}-${latestFor(platform)?.id ?? "new"}`} platform={platform} saved={latestFor(platform)} onSaved={reload} />
        </>
      )}
    </div>
  );
}

/* ============ per-platform panel ============ */
function PlatformPanel({ platform, saved, onSaved }: { platform: Platform; saved: ContentPost | null; onSaved: () => void }) {
  const formats = FORMATS[platform];
  const tmplByName = (n?: string) => TEMPLATES.find((t) => t.name === n) ?? TEMPLATES[0];
  // reprise de la session précédente
  const [format, setFormat] = useState<Format>(saved?.format ?? formats[0].key);
  const [idea, setIdea] = useState(saved?.idea ?? "");
  const [tmpl, setTmpl] = useState<Tmpl>(tmplByName(saved?.template));
  const [refTpl, setRefTpl] = useState<string | null>(REF_TEMPLATES[platform]?.[0]?.id ?? null);
  const [tools, setTools] = useState<string>((saved as { tools?: string[] })?.tools?.join(", ") ?? "");
  const [res, setRes] = useState<Result | null>(saved?.result ?? null);
  const [currentId, setCurrentId] = useState<string | null>(saved?.id ?? null);
  const [err, setErr] = useState<string | null>(null);
  const [sched, setSched] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [slideImages, setSlideImages] = useState<(string | null)[]>(saved?.visuals?.images ?? []);
  const [phase, setPhase] = useState<"idle" | "text" | "visuals">("idle");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const showTemplates = format === "carousel" || format === "post" || format === "image";
  const loading = phase !== "idle";

  async function runVisuals(id: string, expected: number) {
    setPhase("visuals"); setProgress({ done: 0, total: expected });
    const r = await fetch("/api/content/visuals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error ?? "Génération visuels impossible");
    for (let k = 0; k < 90; k++) {
      await new Promise((res) => setTimeout(res, 5000));
      const pr = await fetch(`/api/content/visuals?id=${id}`, { cache: "no-store" });
      const pj = await pr.json();
      if (Array.isArray(pj.images)) { setSlideImages(pj.images); setProgress({ done: pj.images.filter((x: string | null) => x).length, total: pj.images.length }); }
      if (pj.done) break;
    }
    onSaved();
  }

  async function run() {
    if (!idea.trim()) return;
    setPhase("text"); setErr(null); setRes(null); setCurrentId(null); setSlideImages([]); setProgress(null);
    try {
      const r = await fetch("/api/content/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, format, idea, template: showTemplates ? tmpl.name : undefined, refId: refTpl, tools: tools.split(",").map((t) => t.trim()).filter(Boolean) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Génération impossible");
      setRes(j); setCurrentId(j.id);
      const slideCount = (j.slides?.length as number) || (j.headline ? 1 : 0);
      if (showTemplates && refTpl && slideCount > 0) {
        await runVisuals(j.id, slideCount);
      } else { onSaved(); }
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); } finally { setPhase("idle"); setProgress(null); }
  }

  async function download() {
    if (!currentId) return;
    setDownloading(true);
    try {
      const r = await fetch("/api/content/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: currentId }) });
      if (!r.ok) throw new Error("Téléchargement impossible");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `Nonvi-Efa-${platform}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Erreur"); } finally { setDownloading(false); }
  }

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_340px]">
      {/* CONTROLS */}
      <div className="space-y-4 md:order-2">
        <div>
          <Label>Format</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {formats.map((f) => (
              <button key={f.key} onClick={() => setFormat(f.key)}
                className={cn("rounded-lg border px-2.5 py-1.5 text-[12px] font-bold", format === f.key ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white" : "border-[var(--color-line)] hover:bg-white/60")}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Ton idée de contenu</Label>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={4}
            placeholder="Ex. 5 erreurs que font les agences quand elles automatisent leur prospection"
            className="cinput mt-1.5 resize-none" />
        </div>

        {showTemplates && (
          <div>
            <Label>Direction artistique (template)</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTmpl(t)}
                  className={cn("overflow-hidden rounded-lg border-2 transition", tmpl.id === t.id ? "border-[var(--color-ink)]" : "border-transparent")}>
                  <div className="flex h-12 items-center justify-center text-[11px] font-black" style={{ background: t.bg, color: t.fg, fontFamily: t.font }}>Aa</div>
                  <div className="bg-white py-0.5 text-center text-[9px] font-bold text-[var(--color-muted)]">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Modèle {platform === "instagram" ? "Instagram" : "photo (LinkedIn/X)"}</Label>
          <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">Style éditorial du modèle, adapté à ton sujet : carrousel explicatif (schémas, graphs, logos).</p>
          <div className="mt-1.5 flex gap-2 overflow-x-auto pb-1">
            {(REF_TEMPLATES[platform] ?? []).map((t) => (
              <button key={t.id} onClick={() => setRefTpl(t.id)}
                className={cn("relative shrink-0 overflow-hidden rounded-lg border-2 transition", refTpl === t.id ? "border-[var(--color-ink)]" : "border-transparent opacity-80 hover:opacity-100")}>
                <img src={t.src} alt="" className="h-[92px] w-[72px] object-cover" />
                {refTpl === t.id && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-ink)] text-[9px] text-white">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {showTemplates && (
          <div>
            <Label>Outils / logos à afficher</Label>
            <input value={tools} onChange={(e) => setTools(e.target.value)} placeholder="Ex. Claude, Obsidian, n8n"
              className="cinput mt-1.5" />
            <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">Seuls ces logos apparaîtront (vrais logos officiels). Sépare par des virgules.</p>
          </div>
        )}

        <button onClick={run} disabled={!idea.trim() || loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ background: PLAT[platform].color }}>
          <Icon name={loading ? "Loader" : "Sparkles"} size={15} className={loading ? "animate-spin" : ""} />
          {phase === "text" ? "Léa rédige le contenu…"
            : phase === "visuals" ? `Higgsfield crée les visuels… ${progress ? `(${progress.done}/${progress.total})` : ""}`
            : res ? "Regénérer" : "Générer"}
        </button>
        {phase === "visuals" && <div className="text-[11px] text-[var(--color-muted)]">Chaque slide est créée avec ton template (≈1 min/slide).</div>}

        {res && currentId && !loading && (
          <div className="flex gap-2">
            <button onClick={download} disabled={downloading} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-2 text-[12px] font-bold hover:bg-white/60 disabled:opacity-50">
              <Icon name={downloading ? "Loader" : "Download"} size={13} className={downloading ? "animate-spin" : ""} /> Télécharger
            </button>
            <button onClick={() => setSched(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-ink)] px-3 py-2 text-[12px] font-bold text-white hover:opacity-90">
              <Icon name="Calendar" size={13} /> Programmer
            </button>
          </div>
        )}
        {res && saved?.id === currentId && !loading && <div className="text-[11px] font-semibold text-emerald-600">✓ Enregistré (repris de ta session)</div>}
        {err && <div className="rounded-lg border border-red-300 bg-red-50 p-2.5 text-[12px] text-red-600">{err}</div>}
        {res && <CaptionBlock res={res} />}
      </div>

      {/* PREVIEW (en premier, prominent) */}
      <div className="flex justify-center rounded-2xl border border-[var(--color-line)] p-5 md:order-1" style={{ background: platform === "twitter" ? "#f7f9f9" : "#f0f0f3" }}>
        {!res ? (
          <div className="flex h-[400px] items-center justify-center text-center text-[13px] text-[var(--color-muted)]">
            L&apos;aperçu du post apparaîtra ici,<br />comme sur {PLAT[platform].label}.
          </div>
        ) : platform === "instagram" ? <InstagramPreview res={res} tmpl={tmpl} images={slideImages} />
          : platform === "linkedin" ? <LinkedInPreview res={res} tmpl={tmpl} images={slideImages} />
          : <TwitterPreview res={res} images={slideImages} />}
      </div>

      {sched && currentId && <ScheduleModal id={currentId} current={saved?.schedule?.at ?? null} onClose={() => setSched(false)} onSaved={() => { setSched(false); onSaved(); }} />}
      <style jsx>{`.cinput{width:100%;border:1px solid var(--color-line);border-radius:10px;padding:9px 11px;font-size:13px;background:var(--color-bg);color:var(--color-ink)}`}</style>
    </div>
  );
}

/* ============ schedule modal ============ */
function ScheduleModal({ id, current, onClose, onSaved }: { id: string; current: string | null; onClose: () => void; onSaved: () => void }) {
  const [at, setAt] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const save = async (clear = false) => {
    setBusy(true);
    try { await fetch("/api/content/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, at: clear ? "" : at }) }); onSaved(); }
    finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-bg)] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><div className="text-[14px] font-black">Programmer la publication</div><button onClick={onClose}><Icon name="X" size={16} /></button></div>
        <Label>Date & heure</Label>
        <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-[13px]" />
        <div className="mt-4 flex items-center justify-between gap-2">
          {current ? <button onClick={() => save(true)} disabled={busy} className="text-[12px] font-bold text-rose-500">Déprogrammer</button> : <span />}
          <button onClick={() => save(false)} disabled={busy || !at} className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-[13px] font-black text-white disabled:opacity-60">{busy ? "…" : "Programmer"}</button>
        </div>
      </div>
    </div>
  );
}

/* ============ mini visuel (visuel AVANT le texte) ============ */
function MiniVisual({ post }: { post: ContentPost }) {
  const r = post.result;
  const t = tplByName(post.template);
  const genImg = post.visuals?.images?.find((x) => x);
  if (genImg) return <div className="relative aspect-square w-full overflow-hidden"><img src={genImg} alt="" className="h-full w-full object-cover" /></div>;
  if (r.slides?.length || r.headline) {
    const s = r.slides?.[0] ?? { title: r.headline ?? "", body: "" };
    return (
      <div className="relative aspect-square w-full overflow-hidden" style={{ background: t.bg, color: t.fg, fontFamily: t.font }}>
        <div className="flex h-full flex-col justify-between p-4">
          <span className="text-[9px] font-black tracking-widest" style={{ color: t.accent }}>Nonvi-Efa</span>
          <div className="line-clamp-4 text-[15px] font-black leading-tight">{s.title}</div>
          <span className="text-[9px] font-bold" style={{ color: t.sub }}>@Nonvi-Efa.agency</span>
        </div>
      </div>
    );
  }
  // texte (tweet / post linkedin) : tuile aux couleurs du réseau
  const txt = r.tweets?.[0] ?? r.body ?? post.idea;
  return (
    <div className="relative aspect-square w-full overflow-hidden p-4" style={{ background: post.platform === "twitter" ? "#15202b" : "#0A66C2", color: "#fff" }}>
      <div className="flex h-full flex-col justify-between">
        <span>{post.platform === "twitter" ? <XLogo s={16} /> : <span className="text-[13px] font-black">in</span>}</span>
        <div className="line-clamp-5 text-[12px] font-semibold leading-snug">{txt}</div>
        <span className="text-[9px] opacity-80">@Nonvi-Efa</span>
      </div>
    </div>
  );
}

/* ============ modal détail d'un post ============ */
function PostDetailModal({ post, onClose, onChange }: { post: ContentPost; onClose: () => void; onChange: () => void }) {
  const [sched, setSched] = useState(false);
  const t = tplByName(post.template);
  const r = post.result;
  const download = async () => {
    const rr = await fetch("/api/content/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id }) });
    const b = await rr.blob(); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `Nonvi-Efa-${post.platform}.pdf`; a.click(); URL.revokeObjectURL(u);
  };
  const del = async () => { await fetch(`/api/content/schedule?id=${post.id}`, { method: "DELETE" }); onChange(); onClose(); };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-lg rounded-2xl bg-[var(--color-bg)] p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] font-black text-[var(--color-ink)]">
            {post.platform === "instagram" ? <IgLogo s={18} /> : post.platform === "linkedin" ? <LiLogo s={18} /> : <XLogo s={16} />} {post.format}
          </div>
          <button onClick={onClose}><Icon name="X" size={18} /></button>
        </div>
        {/* VISUEL d'abord */}
        <div className="flex justify-center rounded-xl p-3" style={{ background: post.platform === "twitter" ? "#f7f9f9" : "#f0f0f3" }}>
          {post.platform === "instagram" ? <InstagramPreview res={r} tmpl={t} images={post.visuals?.images} />
            : post.platform === "linkedin" ? <LinkedInPreview res={r} tmpl={t} images={post.visuals?.images} />
            : <TwitterPreview res={r} images={post.visuals?.images} />}
        </div>
        {/* puis le texte */}
        <div className="mt-3">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]">Idée</div>
          <p className="text-[13px] text-[var(--color-ink)]">{post.idea}</p>
          {(r.caption || r.body) && <p className="mt-2 whitespace-pre-wrap text-[12px] text-[var(--color-muted)]">{r.caption ?? r.body}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={del} className="text-[12px] font-bold text-rose-500">Supprimer</button>
          <div className="flex gap-2">
            <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-[12px] font-bold hover:bg-white/60"><Icon name="Download" size={13} /> Télécharger</button>
            <button onClick={() => setSched(true)} className="flex items-center gap-1.5 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-[12px] font-bold text-white"><Icon name="Calendar" size={13} /> {post.status === "scheduled" ? "Reprogrammer" : "Programmer"}</button>
          </div>
        </div>
        {sched && <ScheduleModal id={post.id} current={post.schedule?.at ?? null} onClose={() => setSched(false)} onSaved={() => { setSched(false); onChange(); }} />}
      </div>
    </div>
  );
}

/* ============ library (tous les posts par réseau, visuel d'abord) ============ */
function LibraryView({ posts, onChange }: { posts: ContentPost[]; onChange: () => void }) {
  const [open, setOpen] = useState<ContentPost | null>(null);
  if (!posts.length) return <div className="althea-card p-6 text-center text-[13px] text-[var(--color-muted)]">Aucun post encore. Va dans <b>Créer</b> pour en générer. ✍️</div>;
  const groups: { p: Platform; label: string; Logo: typeof IgLogo }[] = [
    { p: "instagram", label: "Instagram", Logo: IgLogo }, { p: "linkedin", label: "LinkedIn", Logo: LiLogo }, { p: "twitter", label: "X / Twitter", Logo: XLogo },
  ];
  return (
    <div className="space-y-6">
      {groups.map(({ p, label, Logo }) => {
        const list = posts.filter((x) => x.platform === p);
        if (!list.length) return null;
        return (
          <div key={p}>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-black text-[var(--color-ink)]"><Logo s={18} /> {label} <span className="text-[var(--color-muted)]">({list.length})</span></div>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((post) => (
                <button key={post.id} onClick={() => setOpen(post)} className="althea-card overflow-hidden text-left transition hover-lift">
                  <MiniVisual post={post} />
                  <div className="p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-muted)]">{post.format}</span>
                      {post.status === "scheduled" ? <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">📅</span> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-[var(--color-muted)]">{post.idea}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {open && <PostDetailModal post={open} onClose={() => setOpen(null)} onChange={onChange} />}
    </div>
  );
}

function CaptionBlock({ res }: { res: Result }) {
  const text = res.caption ?? res.body ?? "";
  if (!text && !(res.hashtags?.length)) return null;
  return (
    <div className="althea-card p-3">
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]">Légende / texte</div>
      {text && <p className="whitespace-pre-wrap text-[12px] text-[var(--color-ink)]">{text}</p>}
      {res.hashtags?.length ? <p className="mt-1.5 text-[12px] font-semibold text-[#0A66C2]">{res.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p> : null}
      <button onClick={() => navigator.clipboard.writeText(text + (res.hashtags?.length ? "\n\n" + res.hashtags.join(" ") : ""))}
        className="mt-2 text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">Copier</button>
    </div>
  );
}

/* ============ carousel slide renderer ============ */
function SlideCard({ slide, i, total, tmpl }: { slide: Slide; i: number; total: number; tmpl: Tmpl }) {
  const isCover = i === 0, isLast = i === total - 1;
  return (
    <div className="relative flex h-full w-full flex-col justify-between p-7" style={{ background: tmpl.bg, color: tmpl.fg, fontFamily: tmpl.font }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black tracking-widest" style={{ color: tmpl.accent }}>Nonvi-Efa</span>
        {!isCover && <span className="text-[11px] font-bold" style={{ color: tmpl.sub }}>{i + 1}/{total}</span>}
      </div>
      <div className="flex-1 flex flex-col justify-center py-4">
        {!isCover && !isLast && <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-black" style={{ background: tmpl.accent, color: tmpl.bg.includes("gradient") ? "#F5411C" : tmpl.bg }}>{i}</span>}
        <div className={cn("font-black leading-tight", isCover ? "text-[30px]" : "text-[22px]")} style={{ letterSpacing: "-0.01em" }}>{slide.title}</div>
        {slide.body && <p className={cn("mt-3 leading-snug", isCover ? "text-[15px]" : "text-[14px]")} style={{ color: tmpl.sub }}>{slide.body}</p>}
      </div>
      <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: tmpl.sub }}>
        <span>@Nonvi-Efa.agency</span>
        {isCover ? <span style={{ color: tmpl.accent }}>Swipe →</span> : isLast ? <span style={{ color: tmpl.accent }}>↗ Contactez-nous</span> : <span>→</span>}
      </div>
    </div>
  );
}

function Carousel({ slides, tmpl, rounded = true, images, ratio = "1/1" }: { slides: Slide[]; tmpl: Tmpl; rounded?: boolean; images?: (string | null)[]; ratio?: string }) {
  const [i, setI] = useState(0);
  const total = slides.length;
  const img = images?.[i];
  return (
    <div className="relative w-full" style={{ aspectRatio: ratio }}>
      <div className={cn("h-full w-full overflow-hidden", rounded && "rounded-lg")}>
        {img ? <img src={img} alt={`slide ${i + 1}`} className="h-full w-full object-cover" /> : <SlideCard slide={slides[i]} i={i} total={total} tmpl={tmpl} />}
      </div>
      {i > 0 && <NavBtn dir="left" onClick={() => setI(i - 1)} />}
      {i < total - 1 && <NavBtn dir="right" onClick={() => setI(i + 1)} />}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {slides.map((_, k) => <span key={k} className="h-1.5 w-1.5 rounded-full" style={{ background: k === i ? "#fff" : "rgba(255,255,255,.5)" }} />)}
      </div>
    </div>
  );
}
function NavBtn({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("absolute top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white", dir === "left" ? "left-2" : "right-2")}>
      <Icon name={dir === "left" ? "ChevronLeft" : "ChevronRight"} size={16} />
    </button>
  );
}

/* ============ INSTAGRAM preview ============ */
function InstagramPreview({ res, tmpl, images }: { res: Result; tmpl: Tmpl; images?: (string | null)[] }) {
  const slides = res.slides ?? (res.headline ? [{ title: res.headline, body: "" }] : []);
  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#dbdbdb] bg-white">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-black text-white" style={{ background: "linear-gradient(135deg,#F5411C,#5B4DEE)" }}>N</div>
        <div className="flex-1"><div className="text-[13px] font-bold leading-none text-black">Nonvi-Efa.agency</div><div className="mt-0.5 text-[11px] text-neutral-500">Sponsorisé</div></div>
        <Icon name="MoreHorizontal" size={18} className="text-black" />
      </div>
      <div className="w-full bg-neutral-100" style={{ aspectRatio: images?.some((x) => x) ? "4/5" : "1/1" }}>
        {slides.length ? <Carousel slides={slides} tmpl={tmpl} rounded={false} images={images} ratio={images?.some((x) => x) ? "4/5" : "1/1"} /> : <div className="flex h-full items-center justify-center text-neutral-400">—</div>}
      </div>
      <div className="flex items-center gap-4 px-3 pt-2.5 text-black">
        <Icon name="Heart" size={22} /><Icon name="MessageCircle" size={22} /><Icon name="Send" size={22} />
        <span className="ml-auto"><Icon name="Bookmark" size={22} /></span>
      </div>
      <div className="px-3 pb-3 pt-1.5">
        <div className="text-[13px] font-bold text-black">1 248 J&apos;aime</div>
        {(res.caption || res.headline) && (
          <p className="mt-1 text-[13px] leading-snug text-black">
            <span className="font-bold">Nonvi-Efa.agency</span>{" "}
            <span className="whitespace-pre-wrap">{res.caption ?? ""}</span>
          </p>
        )}
        {res.hashtags?.length ? <p className="mt-1 text-[13px] text-[#00376b]">{res.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p> : null}
        <div className="mt-1.5 text-[11px] uppercase text-neutral-400">Il y a 2 heures</div>
      </div>
    </div>
  );
}

/* ============ LINKEDIN preview ============ */
function LinkedInPreview({ res, tmpl, images }: { res: Result; tmpl: Tmpl; images?: (string | null)[] }) {
  const isCarousel = res.format === "carousel" && res.slides?.length;
  const isImage = res.format === "image" && res.headline;
  const hasImg = images?.some((x) => x);
  return (
    <div className="w-full max-w-[500px] overflow-hidden rounded-xl border border-[#e0e0e0] bg-white">
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-[15px] font-black text-white" style={{ background: "#141414" }}>N</div>
        <div className="flex-1">
          <div className="flex items-center gap-1 text-[14px] font-bold leading-tight text-[#000000e0]">Nonvi-Efa <span className="text-[12px] font-normal text-neutral-500">• Vous</span></div>
          <div className="text-[12px] leading-tight text-neutral-500">Ingénierie d&apos;agents IA & automatisations · 4 380 abonnés</div>
          <div className="flex items-center gap-1 text-[12px] text-neutral-500">2 h · <Icon name="Globe" size={11} /></div>
        </div>
        <LiLogo s={22} />
      </div>
      {res.body && (
        <div className="px-3 pb-2 text-[14px] leading-snug text-[#000000e0]">
          <p className="whitespace-pre-wrap line-clamp-[8]">{res.body}</p>
        </div>
      )}
      {isCarousel && (
        <div className="mx-3 mb-2 overflow-hidden rounded-lg border border-[#e0e0e0]">
          <Carousel slides={res.slides!} tmpl={tmpl} rounded={false} images={images} ratio="1/1" />
        </div>
      )}
      {isImage && (
        hasImg && images![0] ? (
          <img src={images![0]!} alt="" className="mb-0 w-full object-cover" style={{ aspectRatio: "1/1" }} />
        ) : (
          <div className="mx-0 mb-0 aspect-[1.91/1] w-full" style={{ background: tmpl.bg, fontFamily: tmpl.font }}>
            <div className="flex h-full flex-col justify-center p-7" style={{ color: tmpl.fg }}>
              <span className="text-[11px] font-black tracking-widest" style={{ color: tmpl.accent }}>Nonvi-Efa</span>
              <div className="mt-2 text-[26px] font-black leading-tight" style={{ letterSpacing: "-.01em" }}>{res.headline}</div>
            </div>
          </div>
        )
      )}
      <div className="flex items-center justify-between px-3 py-1.5 text-[12px] text-neutral-500">
        <span className="flex items-center gap-1"><span className="text-[13px]">👍❤️💡</span> 214</span><span>38 commentaires · 12 republications</span>
      </div>
      <div className="mx-3 border-t border-[#e0e0e0]" />
      <div className="flex items-center justify-around px-2 py-1 text-[13px] font-semibold text-neutral-600">
        {[["ThumbsUp", "J'aime"], ["MessageSquare", "Commenter"], ["Repeat2", "Republier"], ["Send", "Envoyer"]].map(([ic, l]) => (
          <div key={l} className="flex items-center gap-1.5 rounded px-3 py-2 hover:bg-neutral-100"><Icon name={ic} size={18} /> {l}</div>
        ))}
      </div>
    </div>
  );
}

/* ============ TWITTER/X preview ============ */
function TwitterPreview({ res, images }: { res: Result; images?: (string | null)[] }) {
  const tweets = res.tweets?.length ? res.tweets : res.body ? [res.body] : [];
  const hookImg = images?.find((x) => x) ?? null;
  return (
    <div className="w-full max-w-[500px] rounded-2xl border border-[#e1e8ed] bg-white p-4">
      {tweets.map((t, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full text-[15px] font-black text-white" style={{ background: "linear-gradient(135deg,#F5411C,#5B4DEE)" }}>N</div>
            {i < tweets.length - 1 && <div className="my-1 w-0.5 flex-1 bg-[#e1e8ed]" />}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-1 text-[15px] leading-tight">
              <span className="font-bold text-black">Nonvi-Efa</span>
              <Icon name="BadgeCheck" size={15} className="text-[#1d9bf0]" />
              <span className="text-neutral-500">@Nonvi-Efa_agency · 2h</span>
              <span className="ml-auto text-black"><XLogo s={15} /></span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug text-black">{t}</p>
            {i === 0 && hookImg && <img src={hookImg} alt="" className="mt-2 w-full rounded-2xl border border-[#e1e8ed] object-cover" />}
            {res.hashtags?.length && i === tweets.length - 1 ? <p className="mt-1 text-[15px] text-[#1d9bf0]">{res.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p> : null}
            <div className="mt-2.5 flex max-w-[320px] items-center justify-between text-neutral-500">
              <span className="flex items-center gap-1 text-[12px]"><Icon name="MessageCircle" size={16} /> 24</span>
              <span className="flex items-center gap-1 text-[12px]"><Icon name="Repeat2" size={16} /> 89</span>
              <span className="flex items-center gap-1 text-[12px]"><Icon name="Heart" size={16} /> 512</span>
              <span className="flex items-center gap-1 text-[12px]"><Icon name="BarChart2" size={16} /> 8,2k</span>
              <span className="flex items-center gap-1 text-[12px]"><Icon name="Bookmark" size={16} /></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">{children}</div>;
}
