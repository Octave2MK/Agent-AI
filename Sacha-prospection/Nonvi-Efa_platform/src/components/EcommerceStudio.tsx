"use client";

/**
 * Studio Vidéo de l'agente e-commerce (Emma) — onglet dédié sur /agents/ecommerce.
 *
 * Parcours : 1) choisir/créer un produit (photo) → 2) choisir le format
 * (avatar qui présente / mise en scène produit) → 3) personnaliser (avatar,
 * script avec presets, ou prompt + ambiance) → 4) générer via Arcads →
 * 5) historique des vidéos (lecture, programmation Instagram).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

/* ================= Types (miroir des routes API) ================= */

interface Product {
  arcadsId: string;
  name: string;
  description?: string;
  photoUrl?: string;
  arcadsImagePath?: string;
}

interface Template {
  id: string;
  imageUrl?: string;
  previewUrl?: string;
  tags?: string[];
}

interface Video {
  id: string;
  kind: "avatar" | "showcase";
  title: string;
  productName: string;
  script?: string;
  prompt?: string;
  actorName?: string;
  actorImageUrl?: string;
  aspectRatio?: string;
  status: "processing" | "completed" | "failed";
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  createdAt: string;
  scheduled?: { day: string; time: string; channel: string; caption?: string };
}

/* ================= Presets de scripts avatar ================= */

const AVATAR_PRESETS = [
  {
    label: "🎁 Unboxing enthousiaste",
    gender: "Female",
    age: "Young Adult",
    script:
      "Je viens de recevoir ce produit et honnêtement… je ne m'attendais pas à ça. Regardez-moi cette qualité ! Je vous montre tout dans cette vidéo. Si vous hésitiez, c'est le signe que vous l'attendiez.",
  },
  {
    label: "😤 Problème → solution",
    gender: "Female",
    age: "Adult",
    script:
      "Vous en avez marre de perdre du temps tous les jours ? Moi aussi, jusqu'à ce que je découvre ce produit. Depuis, plus besoin d'y penser : il fait le travail à ma place. Le lien est en bio.",
  },
  {
    label: "⭐ Avis client authentique",
    gender: "Male",
    age: "Adult",
    script:
      "On me l'a offert il y a un mois. Verdict ? Je l'utilise tous les jours. Ce que je préfère, c'est sa simplicité : tu l'ouvres, ça marche. Franchement, à ce prix-là, foncez.",
  },
  {
    label: "🎓 Expert qui recommande",
    gender: "Male",
    age: "Senior",
    script:
      "Ça fait quinze ans que je travaille dans ce domaine, et ce produit fait partie des rares que je recommande les yeux fermés. Voici pourquoi, en vingt secondes.",
  },
];

const DAYS = ["Lun. 20 avr.", "Mar. 21 avr.", "Mer. 22 avr.", "Jeu. 23 avr.", "Ven. 24 avr.", "Sam. 25 avr.", "Dim. 26 avr."];

/* ================= Composant ================= */

export function EcommerceStudio() {
  const [needsConfig, setNeedsConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Étape 1 — produit
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Étape 2 — format (showcase = avatar AVEC le produit à l'écran, par défaut)
  const [mode, setMode] = useState<"avatar" | "showcase" | "unboxing">("showcase");

  // Étape 3a — avatar : on envoie les critères, Arcads choisit l'acteur
  const [genderFilter, setGenderFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [script, setScript] = useState("");
  const [voices, setVoices] = useState<{ id: string; name: string }[]>([]);
  const [voiceId, setVoiceId] = useState("");

  // Étape 3b — showcase
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "1:1" | "16:9">("9:16");

  // Étape 4 — génération
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  // Historique
  const [videos, setVideos] = useState<Video[]>([]);
  const [scheduleFor, setScheduleFor] = useState<string | null>(null);
  const [schedDay, setSchedDay] = useState(DAYS[4]);
  const [schedTime, setSchedTime] = useState("19:00");
  const [schedCaption, setSchedCaption] = useState("");

  /* ---------- chargements ---------- */

  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/ecommerce/products");
    const data = await res.json();
    if (res.status === 412) { setNeedsConfig(true); return; }
    if (data.products) {
      setProducts(data.products);
      // pré-sélectionne le premier produit pour qu'il y ait toujours une sélection
      setSelectedProduct((cur) => cur ?? data.products[0] ?? null);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/ecommerce/history");
    const data = await res.json();
    if (data.videos) setVideos(data.videos);
  }, []);

  useEffect(() => {
    loadProducts();
    loadHistory();
    // retour du flow OAuth Arcads (?arcads=connected|refused|error)
    const q = new URLSearchParams(window.location.search).get("arcads");
    if (q === "refused") setError("Connexion Arcads refusée — réessayez et acceptez l'accès.");
    if (q === "error") setError("Erreur pendant la connexion Arcads — réessayez.");
  }, [loadProducts, loadHistory]);

  // polling tant qu'une vidéo est en génération
  useEffect(() => {
    if (!videos.some((v) => v.status === "processing")) return;
    const t = setInterval(loadHistory, 12_000);
    return () => clearInterval(t);
  }, [videos, loadHistory]);

  // voix du workspace (clones nommés — dont les voix françaises)
  useEffect(() => {
    if (needsConfig || mode !== "avatar" || voices.length) return;
    fetch("/api/ecommerce/voices")
      .then((r) => r.json())
      .then((d) => {
        if (!d.voices) return;
        setVoices(d.voices);
        // pré-sélectionne la dernière voix utilisée si elle existe encore
        const saved = localStorage.getItem("ecom-voice");
        if (saved && d.voices.some((v: { id: string }) => v.id === saved)) setVoiceId(saved);
      });
  }, [mode, needsConfig, voices.length]);

  // templates (ambiances) — showcase et unboxing ont chacun leur catalogue
  const [unboxTemplates, setUnboxTemplates] = useState<Template[]>([]);
  useEffect(() => {
    if (needsConfig) return;
    if (mode === "showcase" && !templates.length) {
      fetch("/api/ecommerce/actors?templates=showcase")
        .then((r) => r.json())
        .then((d) => { if (d.templates) setTemplates(d.templates); });
    }
    if (mode === "unboxing" && !unboxTemplates.length) {
      fetch("/api/ecommerce/actors?templates=unboxing")
        .then((r) => r.json())
        .then((d) => { if (d.templates) setUnboxTemplates(d.templates); });
    }
  }, [mode, needsConfig, templates.length, unboxTemplates.length]);

  /* ---------- actions ---------- */

  async function createProduct() {
    if (!newName.trim() || !newPhoto) { setError("Nom + photo du produit requis."); return; }
    setCreating(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("name", newName.trim());
      form.set("description", newDesc.trim());
      form.set("photo", newPhoto);
      const res = await fetch("/api/ecommerce/products", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setProducts((p) => [data.product, ...p]);
      setSelectedProduct(data.product);
      setShowNewProduct(false);
      setNewName(""); setNewDesc(""); setNewPhoto(null); setNewPhotoPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function generate() {
    setError(null);
    if (!selectedProduct) { setError("Choisissez d'abord un produit (étape 1)."); return; }
    if (mode === "avatar" && script.trim().length < 10) {
      setError("Écrivez un script (≥ 10 caractères) — Arcads choisit l'avatar pour vous.");
      return;
    }
    if (mode === "showcase" && (!selectedTemplate || prompt.trim().length < 10)) {
      setError("Choisissez une ambiance et décrivez le produit (≥ 10 caractères).");
      return;
    }
    if (mode === "unboxing" && !selectedTemplate) {
      setError("Choisissez une ambiance d'unboxing.");
      return;
    }
    setGenerating(true);
    try {
      const body =
        mode === "avatar"
          ? {
              mode, productArcadsId: selectedProduct.arcadsId, title,
              script, gender: genderFilter || undefined, age: ageFilter || undefined,
              voiceId: voiceId || undefined,
            }
          : mode === "unboxing"
          ? {
              mode, productArcadsId: selectedProduct.arcadsId, title,
              situationId: selectedTemplate!.id,
            }
          : {
              mode, productArcadsId: selectedProduct.arcadsId, title,
              prompt, situationId: selectedTemplate!.id, aspectRatio,
            };
      const res = await fetch("/api/ecommerce/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur de génération");
      setVideos((v) => [data.video, ...v]);
      setTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  }

  async function removeProduct(p: Product) {
    const extra = p.arcadsId.startsWith("local-")
      ? ""
      : "\nIl sera aussi supprimé de votre workspace Arcads.";
    if (!window.confirm(`Supprimer le produit « ${p.name} » ?${extra}`)) return;
    const res = await fetch("/api/ecommerce/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ arcadsId: p.arcadsId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Suppression impossible"); return; }
    setProducts((ps) => {
      const next = ps.filter((x) => x.arcadsId !== p.arcadsId);
      setSelectedProduct((cur) => (cur?.arcadsId === p.arcadsId ? next[0] ?? null : cur));
      return next;
    });
  }

  async function removeVideo(v: Video) {
    if (!window.confirm(`Supprimer la vidéo « ${v.title} » de l'historique ?`)) return;
    const res = await fetch("/api/ecommerce/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: v.id }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Suppression impossible"); return; }
    setVideos((vs) => vs.filter((x) => x.id !== v.id));
  }

  async function schedule(videoId: string, remove = false) {
    const res = await fetch("/api/ecommerce/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        remove ? { videoId, remove: true } : { videoId, day: schedDay, time: schedTime, caption: schedCaption }
      ),
    });
    const data = await res.json();
    if (data.video) {
      setVideos((vs) => vs.map((v) => (v.id === videoId ? data.video : v)));
      setScheduleFor(null);
      setSchedCaption("");
    }
  }

  /* ---------- rendu ---------- */

  if (needsConfig) {
    return (
      <div className="althea-card p-10 text-center">
        <div className="text-[44px] mb-3">🔌</div>
        <h3 className="bronx-name mb-2">Connectez votre compte Arcads</h3>
        <p className="text-[14px] text-[#5A5A5A] max-w-[460px] mx-auto leading-relaxed">
          Pour générer des vidéos produit, connectez la plateforme à votre compte
          Arcads — comme depuis l&apos;appli : un clic, vous vous identifiez chez
          Arcads, et c&apos;est branché pour de bon.
        </p>
        <a href="/api/integrations/arcads/start" className="bronx-cta-solid mt-6 inline-flex">
          <Icon name="Plug" size={16} />
          Connecter Arcads
        </a>
        <p className="mt-4 text-[12px] text-[#8A8A8A]">
          Vous serez redirigée vers arcads.ai pour autoriser l&apos;accès, puis ramenée ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-[#F5411C]/40 bg-[#F5411C]/8 px-4 py-3 text-[13px] font-semibold text-[#C22F0D]">
          ⚠ {error}
        </div>
      )}

      {/* ============ 1 · PRODUIT ============ */}
      <section>
        <StepTitle n="1" title="Le produit" hint="choisissez un produit existant ou ajoutez sa photo" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => {
            const isSelected = selectedProduct?.arcadsId === p.arcadsId;
            return (
              <div
                key={p.arcadsId}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProduct(p)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedProduct(p)}
                className="group/prod althea-card relative overflow-hidden text-left transition-all cursor-pointer"
                // la sélection utilise outline : le box-shadow de althea-card
                // écraserait un ring Tailwind (les deux passent par box-shadow)
                style={isSelected ? { outline: "3px solid #F5411C", outlineOffset: 3 } : undefined}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 z-10 inline-flex items-center gap-1 rounded-full bg-[#F5411C] px-2.5 py-1 text-[10.5px] font-black text-white shadow-md">
                    <Icon name="Check" size={11} />
                    Sélectionné
                  </span>
                )}
                {/* suppression (apparaît au survol) */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeProduct(p); }}
                  title="Supprimer ce produit"
                  className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#8A8A8A] opacity-0 shadow-md transition-opacity group-hover/prod:opacity-100 hover:bg-[#F5411C] hover:text-white"
                >
                  <Icon name="Trash2" size={13} />
                </button>
                <div className="aspect-square bg-[#F7F6FC] flex items-center justify-center overflow-hidden">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Icon name="Package" size={34} className="text-[#C9C6BE]" />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <div className={cn("text-[13px] font-bold truncate", isSelected && "text-[#F5411C]")}>
                    {p.name}
                  </div>
                  {!p.arcadsImagePath && !p.photoUrl && (
                    <div className="text-[10px] text-[#B47A24]">sans photo — mode avatar uniquement</div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Nouveau produit */}
          <button
            type="button"
            onClick={() => setShowNewProduct((s) => !s)}
            className="althea-card flex flex-col items-center justify-center gap-2 aspect-auto min-h-[140px] border-dashed text-[#5A5A5A] hover:text-[#F5411C]"
            style={{ borderStyle: "dashed" }}
          >
            <Icon name="Plus" size={22} />
            <span className="text-[13px] font-bold">Nouveau produit</span>
          </button>
        </div>

        {showNewProduct && (
          <div className="althea-card mt-4 p-5 grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-[#C9C6BE] flex items-center justify-center overflow-hidden bg-[#F7F6FC] hover:border-[#F5411C]"
            >
              {newPhotoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={newPhotoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-center text-[12px] font-semibold text-[#8A8A8A] px-2">
                  📷 Photo du produit
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setNewPhoto(f);
                setNewPhotoPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <div className="space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nom du produit (ex. Gourde isotherme 750 ml)"
                className="w-full rounded-xl border border-[#E4E1F5] px-4 py-2.5 text-[14px] outline-none focus:border-[#F5411C]"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description courte (cible, bénéfice principal) — facultatif"
                rows={2}
                className="w-full rounded-xl border border-[#E4E1F5] px-4 py-2.5 text-[14px] outline-none focus:border-[#F5411C] resize-none"
              />
              <button
                type="button"
                onClick={createProduct}
                disabled={creating}
                className="bronx-cta-solid text-[13px] disabled:opacity-50"
              >
                {creating ? "Création…" : "Ajouter le produit"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ============ 2 · FORMAT ============ */}
      <section>
        <StepTitle n="2" title="Le format" hint="comment le produit apparaît dans la vidéo" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ModeCard
            active={mode === "showcase"}
            onClick={() => { setMode("showcase"); setSelectedTemplate(null); }}
            emoji="🧑‍🎤"
            title="Avatar + produit à l'écran"
            desc="Un avatar présente votre produit, sa photo est intégrée dans la vidéo (recommandé)"
          />
          <ModeCard
            active={mode === "unboxing"}
            onClick={() => { setMode("unboxing"); setSelectedTemplate(null); }}
            emoji="📦"
            title="Unboxing du produit"
            desc="Votre photo produit devient une vidéo d'unboxing POV réaliste"
          />
          <ModeCard
            active={mode === "avatar"}
            onClick={() => setMode("avatar")}
            emoji="🎙️"
            title="Avatar face caméra"
            desc="Tête parlante seule qui lit votre script — ⚠ le produit n'apparaît pas à l'écran"
          />
        </div>
      </section>

      {/* ============ 3 · PERSONNALISATION ============ */}
      {mode === "avatar" ? (
        <section>
          <StepTitle n="3" title="Le script & le style d'avatar" hint="décrivez ce que vous voulez, Arcads s'occupe du casting" />
          {/* presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {AVATAR_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setScript(p.script);
                  setGenderFilter(p.gender);
                  setAgeFilter(p.age);
                }}
                className="rounded-full border border-[#E4E1F5] bg-white px-3.5 py-2 text-[12.5px] font-bold hover:border-[#F5411C] hover:text-[#F5411C] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
          {/* critères de l'avatar — Arcads choisit l'acteur qui correspond */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <FilterSelect
              value={genderFilter}
              onChange={setGenderFilter}
              options={[["", "Genre : peu importe"], ["Female", "Femme"], ["Male", "Homme"]]}
            />
            <FilterSelect
              value={ageFilter}
              onChange={setAgeFilter}
              options={[["", "Âge : peu importe"], ["Young Adult", "Jeune adulte"], ["Adult", "Adulte"], ["Senior", "Senior"]]}
            />
            {/* voix : autocomplétion sur les ~600 voix nommées du workspace */}
            <div className="relative inline-flex items-center">
              <span className="pointer-events-none absolute left-3 text-[13px]">🎙️</span>
              <input
                list="ecom-voices-list"
                defaultValue={voices.find((v) => v.id === voiceId)?.name ?? ""}
                placeholder="Voix (ex. Guillaume)…"
                onChange={(e) => {
                  const match = voices.find(
                    (v) => v.name.toLowerCase() === e.target.value.trim().toLowerCase()
                  );
                  const id = match?.id ?? "";
                  setVoiceId(id);
                  if (id) localStorage.setItem("ecom-voice", id);
                }}
                className={cn(
                  "w-[210px] rounded-full border bg-white py-1.5 pl-8 pr-3 text-[12.5px] font-semibold outline-none",
                  voiceId ? "border-[#188A5C]" : "border-[#E4E1F5] focus:border-[#F5411C]"
                )}
              />
              {voiceId && (
                <span className="absolute right-3 text-[#188A5C]">
                  <Icon name="Check" size={13} />
                </span>
              )}
              <datalist id="ecom-voices-list">
                {[...voices]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((v) => (
                    <option key={v.id} value={v.name} />
                  ))}
              </datalist>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF6EA] px-3 py-1.5 text-[12px] font-bold text-[#188A5C]">
              <Icon name="Sparkles" size={12} />
              Arcads choisit l&apos;avatar — tapez le nom d&apos;une voix française (ex. Guillaume) pour un rendu naturel
            </span>
          </div>
          {/* script */}
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Le script que l'avatar va dire (30-60 mots ≈ 15-25 s de vidéo)…"
            rows={4}
            className="w-full rounded-xl border border-[#E4E1F5] px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-[#F5411C] resize-none"
          />
          <div className="mt-1 text-right text-[11px] text-[#8A8A8A]">
            {script.trim() ? `${script.trim().split(/\s+/).length} mots` : "—"}
          </div>
        </section>
      ) : mode === "unboxing" ? (
        <section>
          <StepTitle
            n="3"
            title="L'ambiance d'unboxing"
            hint="votre photo produit sera déballée dans ce style (~8 min de génération)"
          />
          <TemplateGrid items={unboxTemplates} selected={selectedTemplate} onSelect={setSelectedTemplate} />
        </section>
      ) : (
        <section>
          <StepTitle
            n="3"
            title="Le message & l'ambiance"
            hint="votre photo produit est intégrée dans la vidéo, l'avatar la présente"
          />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez le produit et ce que l'avatar doit mettre en avant (ex. « chaussure de running Adizero bleue, ultra-légère, parfaite pour les marathons — insister sur le confort et le retour d'énergie »)…"
            rows={3}
            className="w-full rounded-xl border border-[#E4E1F5] px-4 py-3 text-[14px] leading-relaxed outline-none focus:border-[#F5411C] resize-none mb-4"
          />
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#8A8A8A]">Format :</span>
            {(["9:16", "16:9"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setAspectRatio(r)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[12.5px] font-bold border transition-colors",
                  aspectRatio === r
                    ? "bg-[#F5411C] border-[#F5411C] text-white"
                    : "bg-white border-[#E4E1F5] hover:border-[#F5411C]"
                )}
              >
                {r} {r === "9:16" ? "· Reels / TikTok" : "· YouTube"}
              </button>
            ))}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF6EA] px-3 py-1.5 text-[12px] font-bold text-[#188A5C]">
              <Icon name="Sparkles" size={12} />
              vidéo en français (France) — demandé automatiquement à Arcads
            </span>
          </div>
          <TemplateGrid items={templates} selected={selectedTemplate} onSelect={setSelectedTemplate} />
        </section>
      )}

      {/* ============ 4 · GÉNÉRER ============ */}
      <section className="althea-card p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de la vidéo (facultatif)"
          className="flex-1 rounded-xl border border-[#E4E1F5] px-4 py-2.5 text-[14px] outline-none focus:border-[#F5411C]"
        />
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="bronx-cta-solid whitespace-nowrap disabled:opacity-50"
        >
          {generating ? "Envoi à Arcads…" : "🎬 Générer la vidéo"}
        </button>
      </section>

      {/* ============ 5 · HISTORIQUE ============ */}
      <section>
        <StepTitle
          n="✦"
          title={`Historique des vidéos${videos.length ? ` (${videos.length})` : ""}`}
          hint="lecture, puis programmation sur Instagram via le calendrier"
        />
        {videos.length === 0 ? (
          <div className="althea-card p-8 text-center text-[13.5px] text-[#8A8A8A]">
            Aucune vidéo pour l&apos;instant — générez la première ci-dessus 👆
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div key={v.id} className="althea-card overflow-hidden flex flex-col">
                {/* média */}
                <div className="relative aspect-[9/16] max-h-[320px] bg-[#101018] flex items-center justify-center">
                  {v.status === "completed" ? (
                    <video
                      // proxy : /watch/{id} redirige vers une URL fraîche → jamais périmée
                      src={`/api/ecommerce/watch/${v.id}`}
                      poster={v.thumbnailUrl}
                      controls
                      preload="metadata"
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  ) : v.status === "processing" ? (
                    <div className="text-center text-white/80 px-4">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <div className="text-[12.5px] font-semibold">Génération en cours chez Arcads…</div>
                      <div className="text-[11px] text-white/50 mt-1">2 à 5 minutes en général</div>
                    </div>
                  ) : (
                    <div className="text-center text-white/80 px-4">
                      <div className="text-[26px] mb-1">😵</div>
                      <div className="text-[12px] font-semibold">Échec : {v.error ?? "erreur inconnue"}</div>
                    </div>
                  )}
                  {v.actorImageUrl && (
                    <span className="absolute top-2 left-2 h-9 w-9 overflow-hidden rounded-full border-2 border-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.actorImageUrl} alt="" className="h-full w-full object-cover" />
                    </span>
                  )}
                </div>
                {/* infos */}
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-bold leading-snug">{v.title}</div>
                    <button
                      type="button"
                      onClick={() => removeVideo(v)}
                      title="Supprimer cette vidéo"
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-[#B8B5C4] transition-colors hover:bg-[#F5411C]/10 hover:text-[#F5411C]"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                  <div className="text-[11px] text-[#8A8A8A]">
                    {v.productName} · {v.kind === "avatar" ? `avatar${v.actorName ? ` ${v.actorName}` : ""}` : "showcase"} ·{" "}
                    {new Date(v.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                  {v.scheduled ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-[#DFF6EA] px-3 py-2">
                      <span className="text-[11.5px] font-bold text-[#188A5C]">
                        📅 Instagram · {v.scheduled.day} à {v.scheduled.time}
                      </span>
                      <button
                        type="button"
                        onClick={() => schedule(v.id, true)}
                        className="text-[10.5px] font-bold text-[#8A8A8A] hover:text-[#F5411C]"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : scheduleFor === v.id ? (
                    <div className="rounded-xl border border-[#E4E1F5] p-3 space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={schedDay}
                          onChange={(e) => setSchedDay(e.target.value)}
                          className="flex-1 rounded-lg border border-[#E4E1F5] px-2 py-1.5 text-[12px]"
                        >
                          {DAYS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                        <input
                          type="time"
                          value={schedTime}
                          onChange={(e) => setSchedTime(e.target.value)}
                          className="rounded-lg border border-[#E4E1F5] px-2 py-1.5 text-[12px]"
                        />
                      </div>
                      <input
                        value={schedCaption}
                        onChange={(e) => setSchedCaption(e.target.value)}
                        placeholder="Légende Instagram (facultatif)"
                        className="w-full rounded-lg border border-[#E4E1F5] px-2 py-1.5 text-[12px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => schedule(v.id)}
                          className="flex-1 rounded-full bg-[#F5411C] py-1.5 text-[12px] font-bold text-white"
                        >
                          Programmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setScheduleFor(null)}
                          className="rounded-full border border-[#E4E1F5] px-3 text-[12px] font-bold"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={v.status !== "completed"}
                      onClick={() => setScheduleFor(v.id)}
                      className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E4E1F5] px-3 py-2 text-[12px] font-bold hover:border-[#F5411C] hover:text-[#F5411C] disabled:opacity-40 transition-colors"
                    >
                      <Icon name="CalendarPlus" size={13} />
                      Programmer sur Instagram
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ================= Petits composants ================= */

function StepTitle({ n, title, hint }: { n: string; title: string; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F5411C] text-[12px] font-black text-white shrink-0 translate-y-0.5">
        {n}
      </span>
      <h3 className="bronx-name" style={{ fontSize: 17 }}>{title}</h3>
      {hint && <span className="text-[12px] text-[#8A8A8A]">— {hint}</span>}
    </div>
  );
}

function ModeCard({
  active, onClick, emoji, title, desc,
}: {
  active: boolean; onClick: () => void; emoji: string; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="althea-card relative p-4 text-left flex items-start gap-3 transition-all"
      style={active ? { outline: "3px solid #F5411C", outlineOffset: 3 } : undefined}
    >
      {active && (
        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F5411C] text-white">
          <Icon name="Check" size={12} />
        </span>
      )}
      <span className="text-[28px]">{emoji}</span>
      <span>
        <span className={cn("block text-[14.5px] font-bold", active && "text-[#F5411C]")}>{title}</span>
        <span className="block mt-0.5 text-[12px] leading-snug text-[#5A5A5A]">{desc}</span>
      </span>
    </button>
  );
}

/** Grille d'ambiances (situations Arcads) avec sélection par outline. */
function TemplateGrid({
  items, selected, onSelect,
}: {
  items: Template[]; selected: Template | null; onSelect: (t: Template) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {items.length === 0 && (
        <div className="col-span-full py-8 text-center text-[13px] text-[#8A8A8A]">
          Chargement des ambiances…
        </div>
      )}
      {items.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t)}
          className="relative overflow-hidden rounded-2xl border border-[#EEEDF6] bg-white transition-all hover:-translate-y-0.5"
          style={selected?.id === t.id ? { outline: "3px solid #F5411C", outlineOffset: 2 } : undefined}
        >
          <div className="aspect-video bg-[#F7F6FC]">
            {t.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : t.previewUrl ? (
              // pas d'image → preview vidéo : « #t=0.1 » force l'affichage de la
              // première frame, et le survol joue l'extrait
              <video
                src={`${t.previewUrl}#t=0.1`}
                muted
                playsInline
                loop
                preload="metadata"
                className="h-full w-full object-cover"
                onMouseEnter={(e) => e.currentTarget.play().catch(() => undefined)}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-[#C9C6BE]">
                <Icon name="Clapperboard" size={22} />
              </div>
            )}
          </div>
          {t.tags && t.tags.length > 0 && (
            <div className="px-2 py-1.5 text-[10.5px] font-semibold text-[#5A5A5A] truncate">
              {t.tags.slice(0, 2).join(" · ")}
            </div>
          )}
          {selected?.id === t.id && (
            <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F5411C] text-white">
              <Icon name="Check" size={12} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-[#E4E1F5] bg-white px-3 py-1.5 text-[12.5px] font-semibold outline-none focus:border-[#F5411C]"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
