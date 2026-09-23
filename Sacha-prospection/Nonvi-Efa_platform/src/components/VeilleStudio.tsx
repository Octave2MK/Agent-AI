"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VeillePost } from "@/lib/veille/store";

/**
 * Studio de veille Instagram (Nina).
 * Source = la RECHERCHE Instagram (classée par l'algorithme), pas le flux
 * hashtag « récents » : c'est ce qui fait remonter les reels à 500k–1M de vues
 * avec de vrais compteurs de likes.
 */
export function VeilleStudio() {
  const [posts, setPosts] = useState<VeillePost[]>([]);
  const [mode, setMode] = useState<"sujet" | "hashtag" | "createur">("sujet");
  const [qFr, setQFr] = useState("");
  const [qEn, setQEn] = useState("");
  const [creators, setCreators] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [limit, setLimit] = useState(30);
  const [pages, setPages] = useState(3);
  const [minViews, setMinViews] = useState(100_000);
  const [minEng, setMinEng] = useState(0);
  const [market, setMarket] = useState("tous");
  const [maxAge, setMaxAge] = useState(0); // fenêtre de fraîcheur en jours (0 = tout)

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<string | null>(null);
  const [imaging, setImaging] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const [showFr, setShowFr] = useState(true);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  // filtres d'affichage (appliqués sur ce qui est déjà en base)
  const [fMarket, setFMarket] = useState("tous");
  const [fMinViews, setFMinViews] = useState(0);
  const [fMaxAge, setFMaxAge] = useState(0); // filtre d'affichage : ≤ N jours (0 = tout)
  const [sortBy, setSortBy] = useState<"views" | "engagement" | "date">("views");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/veille/posts");
      const j = await r.json();
      setPosts(j.posts ?? []);
    } catch {
      /* liste vide */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const ageFloor = fMaxAge ? Date.now() - fMaxAge * 86_400_000 : 0;
    const l = posts
      .filter((p) => fMarket === "tous" || p.market === fMarket)
      .filter((p) => p.views >= fMinViews)
      .filter((p) => !ageFloor || (p.postedAt ? Date.parse(p.postedAt) >= ageFloor : false));
    return [...l].sort((a, b) => {
      if (sortBy === "date") {
        return (b.postedAt ? Date.parse(b.postedAt) : 0) - (a.postedAt ? Date.parse(a.postedAt) : 0);
      }
      if (sortBy === "engagement") return (b.engagementRate ?? 0) - (a.engagementRate ?? 0);
      return b.views - a.views;
    });
  }, [posts, fMarket, fMinViews, fMaxAge, sortBy]);

  const current = posts.find((p) => p.id === selected) ?? null;

  const creatorList = creators
    .split(/[\n,]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  const hashtagList = hashtags
    .split(/[\n,\s]+/)
    .map((h) => h.trim())
    .filter(Boolean);

  async function search() {
    const queries = [qFr, qEn].map((q) => q.trim()).filter(Boolean);
    const common = { minViews, minEngagement: minEng, market, maxAgeDays: maxAge || undefined };
    const body =
      mode === "createur"
        ? { mode, creators: creatorList, limit, ...common }
        : mode === "hashtag"
          ? { mode, hashtags: hashtagList, limit, ...common }
          : { mode, queries, pages, ...common };
    const empty =
      mode === "createur" ? !creatorList.length : mode === "hashtag" ? !hashtagList.length : !queries.length;
    if (empty) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/veille/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Recherche impossible");
      setPosts(j.posts ?? []);
      if (!j.found)
        setError(
          mode === "createur"
            ? "Aucun reel trouvé pour ce(s) compte(s) avec ces filtres — vérifie le pseudo ou baisse le minimum de vues."
            : "Aucun reel ne passe ces filtres — baisse le minimum de vues."
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recherche impossible");
    } finally {
      setBusy(false);
    }
  }

  async function transcribe(id: string) {
    setTranscribing(id);
    setError(null);
    try {
      const r = await fetch("/api/veille/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "Transcription impossible");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription impossible");
    } finally {
      setTranscribing(null);
      await load();
    }
  }

  /** Transcrit les N premiers reels affichés — UN seul appel Apify pour tout le lot. */
  async function transcribeTop(n: number) {
    const todo = shown.filter((p) => p.scriptStatus !== "ok").slice(0, n);
    if (!todo.length) return;
    setBulk({ done: 0, total: todo.length });
    setError(null);
    try {
      const r = await fetch("/api/veille/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: todo.map((p) => p.id) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Transcription impossible");
      setPosts(j.posts ?? []);
      setBulk({ done: j.transcrits ?? 0, total: j.total ?? todo.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription impossible");
      await load();
    } finally {
      setTimeout(() => setBulk(null), 1500);
    }
  }

  /** Traduit le script du reel en français. */
  async function translate(id: string) {
    setTranslating(id);
    setError(null);
    try {
      const r = await fetch("/api/veille/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (j.posts) setPosts(j.posts);
      if (!r.ok) throw new Error(j.error ?? "Traduction impossible");
      setShowFr(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Traduction impossible");
    } finally {
      setTranslating(null);
    }
  }

  /** Transforme le script en short animé (schémas Bronx, MP4 9:16). */
  async function imager(id: string) {
    setImaging(id);
    setError(null);
    try {
      const r = await fetch("/api/veille/imager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (j.posts) setPosts(j.posts);
      if (!r.ok) throw new Error(j.error ?? "Génération impossible");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setImaging(null);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/veille/posts?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (selected === id) setSelected(null);
    await load();
  }

  const withScript = shown.filter((p) => p.scriptStatus === "ok").length;

  return (
    <div className="space-y-4">
      {/* ---------- Recherche ---------- */}
      <div className="althea-card space-y-3 p-4">
        {/* Mode : par sujet (recherche algo) ou par créateur (reels d'un profil) */}
        <div className="inline-flex rounded-lg border border-[var(--color-line)] bg-white p-0.5">
          {([
            ["sujet", "Par sujet"],
            ["hashtag", "Par hashtag · récents"],
            ["createur", "Par créateur"],
          ] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3.5 py-1.5 text-[13px] font-bold transition ${
                mode === m ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "sujet" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Recherche — marché FR">
              <input
                value={qFr}
                onChange={(e) => setQFr(e.target.value)}
                placeholder="automatisation IA entreprise"
                className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] outline-none"
              />
            </Field>
            <Field label="Recherche — marché US">
              <input
                value={qEn}
                onChange={(e) => setQEn(e.target.value)}
                placeholder="ai automation business"
                className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] outline-none"
              />
            </Field>
          </div>
        ) : mode === "hashtag" ? (
          <Field label="Hashtags — sans le #, séparés par une virgule ou un espace">
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="ai, chatgpt, automatisation, iabusiness"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] outline-none"
            />
          </Field>
        ) : (
          <Field label="Comptes Instagram — pseudo, @pseudo ou URL, séparés par une virgule">
            <input
              value={creators}
              onChange={(e) => setCreators(e.target.value)}
              placeholder="@alexhormozi, garyvee, https://instagram.com/…"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] outline-none"
            />
          </Field>
        )}

        <div className="flex flex-wrap items-end gap-3">
          {mode === "sujet" ? (
            <Field label="Profondeur">
              <select
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
              >
                {[1, 3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} page{n > 1 ? "s" : ""} · ~{n * 12} reels</option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label={mode === "hashtag" ? "Reels par hashtag" : "Reels par compte"}>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
              >
                {[12, 24, 30, 50, 100].map((n) => (
                  <option key={n} value={n}>{n} reels</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Vues minimum">
            <select
              value={minViews}
              onChange={(e) => setMinViews(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
            >
              {[0, 50_000, 100_000, 250_000, 500_000, 1_000_000].map((n) => (
                <option key={n} value={n}>{n === 0 ? "aucun" : fmt(n)}</option>
              ))}
            </select>
          </Field>
          <Field label="Engagement min.">
            <select
              value={minEng}
              onChange={(e) => setMinEng(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
            >
              {[0, 1, 2, 3, 5].map((n) => (
                <option key={n} value={n}>{n === 0 ? "aucun" : `${n} %`}</option>
              ))}
            </select>
          </Field>
          <Field label="Marché">
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
            >
              <option value="tous">tous</option>
              <option value="fr">français</option>
              <option value="en">anglais</option>
            </select>
          </Field>
          <Field label="Période">
            <select
              value={maxAge}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaxAge(v);
                if (v > 0) setSortBy("date"); // récents d'abord
              }}
              className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[14px]"
            >
              {[
                [0, "toutes dates"],
                [3, "3 derniers jours"],
                [7, "7 derniers jours"],
                [14, "14 derniers jours"],
                [30, "30 derniers jours"],
              ].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <button
            onClick={() => void search()}
            disabled={
              busy ||
              (mode === "createur"
                ? !creatorList.length
                : mode === "hashtag"
                  ? !hashtagList.length
                  : !qFr.trim() && !qEn.trim())
            }
            className="rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-40"
          >
            {busy
              ? "Recherche en cours…"
              : mode === "createur"
                ? "Récupérer les reels du créateur"
                : mode === "hashtag"
                  ? "Chercher les reels récents"
                  : "Chercher les plus performants"}
          </button>
        </div>

        {busy && (
          <p className="text-[12.5px] text-[var(--color-muted)]">
            {mode === "createur"
              ? "Les reels de chaque compte sont récupérés puis classés par vues. Compte 1 à 3 minutes."
              : mode === "hashtag"
                ? "Les reels récents des hashtags sont récupérés (classés par date). Compte 1 à 3 minutes."
                : "Les deux marchés sont interrogés en parallèle. Compte 1 à 3 minutes selon la profondeur."}
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>}
        {maxAge > 0 && (
          <p className="text-[12px] text-[var(--color-muted)]">
            Période active (≤ {maxAge} j) : le plancher de vues est abaissé automatiquement pour laisser passer
            les reels récents (qui n&apos;ont pas encore cumulé beaucoup de vues).
          </p>
        )}
        <p className="text-[12px] text-[var(--color-muted)]">
          {mode === "createur" ? (
            <>
              Récupère les reels d&apos;un ou plusieurs <b>comptes précis</b> et les classe par vues —
              idéal pour disséquer ce qui marche chez un concurrent ou un créateur de référence.
            </>
          ) : mode === "hashtag" ? (
            <>
              <b>Pour les reels récents.</b> La recherche « par sujet » classe par popularité (donc des reels
              anciens). Le flux <b>hashtag</b> remonte du récent (avec vrais likes) : mets une <b>Période</b> +
              un hashtag <b>large</b> (#ai, #chatgpt…) pour voir les derniers jours.
            </>
          ) : (
            <>
              Le classement vient de la <b>recherche</b> Instagram (par popularité) : idéal pour les gros
              performeurs, mais <b>pas pour le récent</b> → passe en « Par hashtag · récents » pour ça.
            </>
          )}
        </p>
      </div>

      {/* ---------- Filtres d'affichage ---------- */}
      {posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--color-muted)]">Trier</span>
          {(["views", "engagement", "date"] as const).map((s) => (
            <Pill key={s} on={sortBy === s} onClick={() => setSortBy(s)}>
              {s === "views" ? "Vues" : s === "engagement" ? "Engagement" : "Récents"}
            </Pill>
          ))}
          <span className="ml-3 text-[12px] font-bold uppercase tracking-wide text-[var(--color-muted)]">Marché</span>
          {["tous", "fr", "en"].map((m) => (
            <Pill key={m} on={fMarket === m} onClick={() => setFMarket(m)}>
              {m === "tous" ? "Tous" : m.toUpperCase()}
            </Pill>
          ))}
          <select
            value={fMinViews}
            onChange={(e) => setFMinViews(Number(e.target.value))}
            className="ml-3 rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-[12.5px]"
          >
            {[0, 100_000, 500_000, 1_000_000].map((n) => (
              <option key={n} value={n}>{n === 0 ? "toutes vues" : `> ${fmt(n)} vues`}</option>
            ))}
          </select>
          <select
            value={fMaxAge}
            onChange={(e) => setFMaxAge(Number(e.target.value))}
            className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1 text-[12.5px]"
          >
            {[
              [0, "toutes dates"],
              [3, "≤ 3 j"],
              [7, "≤ 7 j"],
              [14, "≤ 14 j"],
              [30, "≤ 30 j"],
            ].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12.5px] text-[var(--color-muted)]">
              {shown.length} reels · {withScript} avec script
            </span>
            <button
              onClick={() => void transcribeTop(10)}
              disabled={!!bulk || busy}
              className="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-40"
            >
              {bulk ? `Transcription ${bulk.done}/${bulk.total}…` : "Transcrire le top 10"}
            </button>
          </div>
        </div>
      )}

      {posts.length === 0 && !busy && (
        <div className="althea-card p-8 text-center text-[14px] text-[var(--color-muted)]">
          Lance une recherche ci-dessus. Saisis une requête en français et/ou en anglais pour couvrir
          les deux marchés.
        </div>
      )}

      {/* ---------- Grille + détail ---------- */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`althea-card overflow-hidden text-left transition ${
                selected === p.id ? "outline outline-2 outline-[var(--color-ink)]" : ""
              }`}
            >
              <div className="relative aspect-[4/5] bg-[var(--color-marine-50)]">
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/veille/thumb?u=${encodeURIComponent(p.thumbnailUrl)}`}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[12px] text-[var(--color-muted)]">
                    pas d&apos;aperçu
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-black text-white">
                  #{i + 1}
                </span>
                <span className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-black uppercase">
                  {p.market}
                </span>
                <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white">
                  {fmt(p.views)} vues
                </span>
                {p.scriptStatus === "ok" && (
                  <span className="absolute bottom-2 right-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-white">
                    script
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-bold">@{p.author}</span>
                  <span className="shrink-0 text-[11px] font-bold text-[var(--color-muted)]">
                    {p.engagementRate?.toFixed(1) ?? "0"}%
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--color-muted)]">
                  {p.caption || "(sans légende)"}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Détail — sticky : suit le scroll de la grille de reels */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {current ? (
            <div className="althea-card space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-black">@{current.author}</div>
                  <div className="text-[12px] text-[var(--color-muted)]">
                    {current.authorName}
                    {current.authorFollowers ? ` · ${fmt(current.authorFollowers)} abonnés` : ""}
                  </div>
                </div>
                <button
                  onClick={() => void remove(current.id)}
                  className="rounded-md border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-muted)] hover:bg-red-50 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <Metric label="Vues" value={fmt(current.views)} strong />
                <Metric label="Likes" value={current.likes < 0 ? "masqué" : fmt(current.likes)} muted={current.likes < 0} />
                <Metric label="Comm." value={fmt(current.comments)} />
                <Metric label="Engag." value={`${current.engagementRate?.toFixed(1) ?? 0}%`} />
              </div>

              <div className="space-y-1 text-[12.5px] text-[var(--color-muted)]">
                {current.postedAt && <div>Publié le {new Date(current.postedAt).toLocaleDateString("fr-FR")}</div>}
                {current.durationSec != null && <div>Durée : {Math.round(current.durationSec)} s</div>}
                <div>Marché détecté : {current.market}</div>
              </div>

              <div>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">Légende</div>
                <p className="max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg bg-[var(--color-surface)] p-2.5 text-[12.5px] leading-snug">
                  {current.caption || "(sans légende)"}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                    Script de la vidéo
                  </span>
                  <div className="flex items-center gap-1.5">
                    {current.scriptStatus === "ok" && current.scriptFr && (
                      <div className="flex overflow-hidden rounded-md border border-[var(--color-line)] text-[10.5px] font-bold">
                        <button
                          onClick={() => setShowFr(false)}
                          className={`px-2 py-1 ${!showFr ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
                        >
                          VO
                        </button>
                        <button
                          onClick={() => setShowFr(true)}
                          className={`px-2 py-1 ${showFr ? "bg-[var(--color-ink)] text-white" : "text-[var(--color-muted)]"}`}
                        >
                          FR
                        </button>
                      </div>
                    )}
                    {current.scriptStatus === "ok" && !current.scriptFr && (
                      <button
                        onClick={() => void translate(current.id)}
                        disabled={translating === current.id}
                        className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-[11px] font-bold disabled:opacity-40 hover:bg-[var(--color-marine-50)]"
                      >
                        {translating === current.id ? "Traduction…" : "Traduire en FR"}
                      </button>
                    )}
                    {current.scriptStatus !== "ok" && (
                      <button
                        onClick={() => void transcribe(current.id)}
                        disabled={transcribing === current.id}
                        className="rounded-md bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                      >
                        {transcribing === current.id ? "Transcription…" : "Extraire le script"}
                      </button>
                    )}
                  </div>
                </div>
                {current.scriptStatus === "ok" ? (
                  <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-[12.5px] leading-relaxed">
                    {showFr && current.scriptFr ? current.scriptFr : current.script}
                  </div>
                ) : current.scriptStatus === "erreur" ? (
                  <p className="rounded-lg bg-red-50 p-2.5 text-[12px] text-red-700">{current.scriptError}</p>
                ) : transcribing === current.id ? (
                  <p className="rounded-lg bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-muted)]">
                    Téléchargement puis écoute par l&apos;IA — 30 s à 1 min.
                  </p>
                ) : (
                  <p className="rounded-lg bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-muted)]">
                    Pas encore extrait.
                  </p>
                )}
              </div>

              {/* ---------- Short illustré (schémas animés) ---------- */}
              {current.scriptStatus === "ok" && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
                      Short illustré · schémas animés
                    </span>
                    <button
                      onClick={() => void imager(current.id)}
                      disabled={imaging === current.id}
                      className="rounded-md bg-[var(--color-ink)] px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                    >
                      {imaging === current.id
                        ? "Génération…"
                        : current.shortStatus === "ok"
                          ? "Régénérer"
                          : "🎬 Imager le script"}
                    </button>
                  </div>

                  {imaging === current.id || current.shortStatus === "en-cours" ? (
                    <p className="rounded-lg bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-muted)]">
                      Claude compose les schémas puis la vidéo est rendue — compte 1 à 3 min.
                    </p>
                  ) : current.shortStatus === "ok" && current.shortUrl ? (
                    <div className="space-y-1.5">
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        src={current.shortUrl}
                        controls
                        loop
                        className="aspect-video w-full rounded-lg border border-[var(--color-line)] bg-black"
                      />
                      <a
                        href={current.shortUrl}
                        download
                        className="inline-block rounded-md border border-[var(--color-line)] px-2.5 py-1 text-[11px] font-bold hover:bg-[var(--color-marine-50)]"
                      >
                        Télécharger le MP4
                      </a>
                    </div>
                  ) : current.shortStatus === "erreur" ? (
                    <p className="rounded-lg bg-red-50 p-2.5 text-[12px] text-red-700">
                      {current.shortError ?? "Génération impossible."}
                    </p>
                  ) : (
                    <p className="rounded-lg bg-[var(--color-surface)] p-2.5 text-[12px] text-[var(--color-muted)]">
                      Génère une vidéo 16:9 de schémas animés qui expliquent le script (style Bronx, glassmorphism).
                    </p>
                  )}
                </div>
              )}

              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-[var(--color-line)] py-2 text-center text-[13px] font-bold hover:bg-[var(--color-marine-50)]"
              >
                Ouvrir sur Instagram
              </a>
            </div>
          ) : (
            <div className="althea-card p-6 text-center text-[13px] text-[var(--color-muted)]">
              Clique sur un reel pour voir le détail et son script.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold ${
        on
          ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
          : "border-[var(--color-line)] bg-white text-[var(--color-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function Metric({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <div className={`rounded-lg p-2 text-center ${strong ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-surface)]"}`}>
      <div className={`text-[14px] font-black ${muted ? "text-[var(--color-muted)]" : ""}`}>{value}</div>
      <div className={`text-[9.5px] uppercase tracking-wide ${strong ? "text-white/70" : "text-[var(--color-muted)]"}`}>
        {label}
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n < 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
