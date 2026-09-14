"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { DesignerImagesPanel } from "./DesignerImagesPanel";
import { EmailDraftsPanel } from "./EmailDraftsPanel";
import { CarouselSlidesPanel, detectCarousel } from "./CarouselSlidesPanel";
import { ContactDashboardPanel } from "./ContactDashboardPanel";
import { ProgressStepper } from "./ProgressStepper";
import { cn } from "@/lib/utils";

export interface AgentChatProps {
  agentSlug: string;
  agentName: string;
  accent: "marine" | "nude" | "muted";
  suggestions?: string[];
  disabled?: boolean;
}

const CAN_SAVE: string[] = ["strategiste", "createur-contenu", "designer", "presentateur", "analyste", "gmail", "fireflies", "cv"];
// Agents avec flux PLAN → « Approuver & créer » → vrai livrable.
const CREATE_CAPABLE: string[] = ["proposition", "strategiste", "presentateur", "analyste", "createur-contenu", "cv", "fireflies", "gmail"];

export function AgentChat({ agentSlug, agentName, accent, suggestions = [], disabled }: AgentChatProps) {
  const storageKey = `naiom-chat:${agentSlug}`;
  const router = useRouter();

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { agentSlug },
    }),
  });

  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfResult, setPdfResult] = useState<{ filename: string; url: string; slides: number | null } | null>(null);
  // Flux "Approuver & créer" : après le plan de l'agent → création du vrai livrable
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ kind: string; title: string; url?: string; filename?: string; markdown?: string; note?: string } | null>(null);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restaurer la conversation depuis localStorage au montage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // noop
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Sauvegarder la conversation à chaque changement (une fois hydraté pour éviter d'écraser)
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (messages.length === 0) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {
      // noop
    }
  }, [messages, hydrated, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, status]);

  // Toast auto-hide
  useEffect(() => {
    if (!saveToast) return;
    const t = setTimeout(() => setSaveToast(null), 3500);
    return () => clearTimeout(t);
  }, [saveToast]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || status !== "ready") return;
    setCreated(null); setCreateErr(null); // nouveau message → on repart d'un plan neuf
    sendMessage({ text: t });
    setInput("");
  };

  const approveCreate = async () => {
    setCreating(true); setCreateErr(null); setCreated(null);
    try {
      const res = await fetch("/api/agents/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentSlug, messages }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `Erreur ${res.status}`);
      setCreated(j);
    } catch (e) { setCreateErr(e instanceof Error ? e.message : "Erreur"); } finally { setCreating(false); }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(input);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  };

  const lastAssistantText = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") {
        const text = m.parts
          .map((p) => (p.type === "text" && "text" in p && typeof p.text === "string" ? p.text : ""))
          .join("")
          .trim();
        if (text) return text;
      }
    }
    return "";
  })();

  const canSave = CAN_SAVE.includes(agentSlug) && lastAssistantText.length > 80 && status === "ready";
  // Par défaut, tous les rapports passent par le pipeline PRÉSENTATION (deck visuel).
  // Seul le Stratège garde le format document texte (un brief est un document, pas un deck).
  // Le Présentateur passe aussi par presentations/ (sans agentSlug → dépôt dans decks/).
  // Gmail + Fireflies n'ont PAS de PDF : résultat visualisé direct via ContactDashboardPanel (maître-détail).
  // CV garde le PDF (entretiens à partager). Analyste/Présentateur gardent le PDF deck.
  const pdfMode: "presentation" | "report" | null =
    agentSlug === "presentateur"
      ? "presentation"
      : ["analyste", "cv"].includes(agentSlug)
      ? "presentation"
      : agentSlug === "strategiste"
      ? "report"
      : null;
  const canGeneratePdf = pdfMode !== null && lastAssistantText.length > 80 && status === "ready";

  const generatePdf = async () => {
    if (!lastAssistantText || !pdfMode) return;
    setGeneratingPdf(true);
    setPdfResult(null);
    try {
      const endpoint = pdfMode === "presentation" ? "/api/presentations/generate" : "/api/reports/generate";
      // Pour les agents non-presentateur en mode presentation, on passe agentSlug pour
      // que le PDF atterrisse dans le bon dossier (analytics/, gmail/, meetings/, hiring/).
      const body = pdfMode === "presentation"
        ? (agentSlug === "presentateur"
            ? { markdown: lastAssistantText }
            : { markdown: lastAssistantText, agentSlug })
        : { markdown: lastAssistantText, agentSlug };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setPdfResult({ filename: data.filename, url: data.downloadUrl, slides: data.slidesCount ?? null });
      window.open(data.downloadUrl, "_blank");
      router.refresh();
    } catch (e) {
      setSaveToast({
        kind: "error",
        text: e instanceof Error ? e.message : "Échec de la génération PDF.",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const openSaveDialog = () => {
    // Titre suggéré = première phrase de la réponse, tronquée
    const firstLine = lastAssistantText.split(/\n/).find((l) => l.trim().length > 10) ?? "";
    const cleaned = firstLine.replace(/^[#>*-]+\s*/, "").replace(/\*\*/g, "").slice(0, 70);
    setSaveTitle(cleaned || "Nouveau livrable");
    setSaveDialogOpen(true);
  };

  const doSave = async () => {
    if (!saveTitle.trim() || !lastAssistantText) return;
    setSaving(true);
    try {
      const res = await fetch("/api/deliverable/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug,
          title: saveTitle,
          content: lastAssistantText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setSaveDialogOpen(false);
      setSaveToast({ kind: "success", text: `« ${data.title} » enregistré dans vos livrables.` });
      // Rafraîchir le panel livrables (Server Component)
      router.refresh();
    } catch (e) {
      setSaveToast({
        kind: "error",
        text: e instanceof Error ? e.message : "Échec de l'enregistrement.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (disabled) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl glass-brutal px-8 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-ink)] border border-white/10 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
          <Icon name="Lock" size={22} />
        </div>
        <h3 className="h-section mt-2">Agent bientôt disponible</h3>
        <p className="max-w-md text-sm text-[var(--color-ink-soft)]">
          {agentName} n&apos;est pas encore actif sur votre espace. Vous serez notifié dès qu&apos;il sera prêt à l&apos;emploi.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl glass-brutal">
      <header className="flex items-center justify-between border-b border-[#0a1410]/10 px-5 py-3 bg-[var(--color-bg-soft)]">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0a1410]">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              status === "streaming" || status === "submitted"
                ? "bg-[var(--color-nude-500)] animate-pulse"
                : "bg-emerald-500"
            )}
            aria-hidden
          />
          Conversation avec {agentName}
        </div>
        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <span className="text-[11px] text-[#1e3a2c]">
              {messages.length} message{messages.length > 1 ? "s" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={resetConversation}
            disabled={messages.length === 0 || status === "streaming" || status === "submitted"}
            className="flex items-center gap-1 text-xs text-[#1e3a2c] hover:text-[#0a1410] disabled:opacity-40"
          >
            <Icon name="RotateCcw" size={12} /> Réinitialiser
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4 min-w-0">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 shadow-[0_10px_28px_-10px_rgba(0,0,0,0.6)]",
                accent === "marine" && "bg-[var(--color-bg)] text-[var(--color-ink)]",
                accent === "nude" && "bg-[var(--color-accent)] text-white",
                accent === "muted" && "bg-white text-[#0a1410]"
              )}
            >
              <Icon name="Sparkles" size={24} />
            </div>
            <div>
              <h3 className="h-section">Démarrer une conversation</h3>
              <p className="mt-2 text-sm max-w-md mx-auto text-[var(--color-ink-soft)]">
                {agentName} connaît déjà votre charte de marque, vos personas et votre historique de campagnes. Posez-lui une question ou choisissez un point de départ.
              </p>
            </div>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border border-[#0a1410]/15 bg-[var(--color-bg-soft)]/95 backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-[#0a1410] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] hover-lift shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {(() => {
          const isStreaming = status === "streaming" || status === "submitted";
          // Index du dernier message assistant
          let lastAssistantIdx = -1;
          for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === "assistant") {
              lastAssistantIdx = i;
              break;
            }
          }
          return messages.map((msg, idx) => {
            // Pendant le streaming, on cache la dernière réponse assistant en cours :
            // le ProgressStepper s'affichera à sa place.
            if (msg.role === "assistant" && idx === lastAssistantIdx && isStreaming) {
              return null;
            }
            if (msg.role === "user") {
              return <MessageBubble key={msg.id} role={msg.role} parts={msg.parts} accent={accent} />;
            }
            return <AssistantDeliverableCard key={msg.id} parts={msg.parts} accent={accent} />;
          });
        })()}

        {(status === "streaming" || status === "submitted") && (
          <ProgressStepper
            agentSlug={agentSlug}
            agentName={agentName}
            streamedChars={lastAssistantText.length}
            pending={status === "submitted"}
            accent={accent}
          />
        )}

        {/* FLUX PLAN → APPROUVER & CRÉER : après le plan de l'agent, on crée le vrai livrable. */}
        {CREATE_CAPABLE.includes(agentSlug) && status === "ready" && lastAssistantText.length > 40 && !created && (
          <div className="flex flex-col items-start gap-2 rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4">
            <div className="text-[13px] font-semibold text-emerald-900">Plan prêt. Valide-le pour que {agentName} crée le livrable.</div>
            <button
              onClick={approveCreate}
              disabled={creating}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[13px] font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Icon name={creating ? "Loader" : "CheckCircle"} size={15} className={creating ? "animate-spin" : ""} />
              {creating ? "Création en cours…" : "✅ Approuver & créer le livrable"}
            </button>
            {createErr && <div className="text-[12px] font-semibold text-red-600">{createErr}</div>}
          </div>
        )}

        {created && (
          <div className="rounded-2xl border border-[#0a1410]/10 bg-white p-5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"><Icon name="CheckCircle" size={18} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[17px] font-black tracking-tight text-[#0a1410]">{created.title}</div>
                <div className="text-[12px] font-semibold text-emerald-700">Livrable créé{created.note ? ` · ${created.note}` : ""}</div>
              </div>
              {created.url && (
                <a href={created.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-xl bg-[var(--color-ink,#0a1410)] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-90">
                  <Icon name={created.kind === "pdf" ? "FileText" : "Download"} size={14} /> {created.kind === "pdf" ? "Ouvrir le PDF" : "Télécharger"}
                </a>
              )}
            </div>
            {created.kind === "pdf" && created.url && (
              <iframe src={`${created.url}#toolbar=1&view=FitH`} title={created.title} className="mt-4 h-[520px] w-full rounded-lg border border-black/10 bg-black/5" />
            )}
            {created.kind !== "pdf" && created.markdown && (
              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-lg border border-black/10 bg-[#faf6ee] p-4">
                <MarkdownPreview text={created.markdown} />
              </div>
            )}
          </div>
        )}

        {lastAssistantText && status === "ready" && (
          <CarouselSlidesPanel agentSlug={agentSlug} markdown={lastAssistantText} />
        )}

        {/* DesignerImagesPanel : visible sur les agents qui peuvent vraiment
            produire des prompts Nano Banana (Designer + Créateur quand il
            annote des illustrations décoratives). Masqué sur Créateur quand
            un carrousel est détecté (la génération passe par HTML → PNG). */}
        {lastAssistantText && status === "ready" &&
          !(agentSlug === "createur-contenu" && detectCarousel(lastAssistantText).hasCarousel) && (
            <DesignerImagesPanel agentSlug={agentSlug} markdown={lastAssistantText} />
          )}

        {/* Dashboard maître-détail : Fireflies (prospects) et Gmail (contacts/threads).
            S'affiche uniquement si l'agent a produit des blocs [prospect] / [contact]. */}
        {(agentSlug === "fireflies" || agentSlug === "gmail") && lastAssistantText && status === "ready" && (
          <ContactDashboardPanel
            agentSlug={agentSlug}
            markdown={lastAssistantText}
            mode={agentSlug === "fireflies" ? "fireflies" : "gmail"}
          />
        )}

        {["gmail", "cv", "fireflies"].includes(agentSlug) && lastAssistantText && status === "ready" && (
          <EmailDraftsPanel agentSlug={agentSlug} markdown={lastAssistantText} />
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            Une erreur est survenue : {error.message}. Réessayez ou contactez l'administrateur.
          </div>
        )}
      </div>

      <form onSubmit={onFormSubmit} className="border-t border-[#0a1410]/10 bg-[var(--color-bg-soft)] p-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
            disabled={status !== "ready"}
            placeholder={`Demandez à ${agentName}…  (Entrée pour envoyer, Maj+Entrée pour retour à la ligne)`}
            className="w-full resize-none rounded-xl border border-[#0a1410]/15 bg-white/90 backdrop-blur-xl px-3 py-2.5 text-sm font-medium text-[#0a1410] placeholder:text-[#7A7568] outline-none focus:border-[#0a1410]/30 focus:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-shadow disabled:opacity-60"
          />
          <div className="flex items-center justify-between pt-2.5 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {canSave && (
                <button
                  type="button"
                  onClick={openSaveDialog}
                  className="flex items-center gap-1.5 rounded-lg border border-[#0a1410]/15 bg-white/90 backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-[#0a1410] hover:bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] hover-lift"
                >
                  <Icon name="Save" size={12} /> Enregistrer comme livrable
                </button>
              )}
              {canGeneratePdf && (
                <button
                  type="button"
                  onClick={generatePdf}
                  disabled={generatingPdf}
                  className="flex items-center gap-1.5 rounded-lg border border-[#0a1410]/15 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#0a1410] hover:bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] hover-lift disabled:opacity-60"
                >
                  {generatingPdf ? (
                    <>
                      <Icon name="Loader" size={12} className="animate-spin" /> Génération PDF…
                    </>
                  ) : (
                    <>
                      <Icon name="FileText" size={12} />
                      {pdfMode === "presentation" ? "Générer le PDF visuel" : "Générer le PDF"}
                    </>
                  )}
                </button>
              )}
              {pdfResult && !generatingPdf && (
                <a
                  href={pdfResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border-2 border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 shadow-[1.5px_1.5px_0_rgba(5,150,105,0.8)]"
                >
                  <Icon name="Download" size={12} />
                  PDF prêt{pdfResult.slides ? ` (${pdfResult.slides} slides)` : ""}
                </a>
              )}
            </div>
            <div className="flex gap-2">
              {(status === "submitted" || status === "streaming") && (
                <button
                  type="button"
                  onClick={() => stop()}
                  className="rounded-lg border border-[#0a1410]/15 bg-white/90 backdrop-blur-xl px-3 py-1.5 text-xs font-bold text-[#0a1410] hover:bg-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
                >
                  Arrêter
                </button>
              )}
              <button
                type="submit"
                disabled={status !== "ready" || !input.trim()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-accent-hover)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] hover-lift disabled:opacity-40 disabled:hover:transform-none"
              >
                <Icon name="Send" size={12} /> Envoyer
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Dialog enregistrement */}
      {saveDialogOpen && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => !saving && setSaveDialogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-[#0a1410]/10 bg-white shadow-[0_18px_50px_-14px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <header className="flex items-center justify-between border-b border-[#0a1410]/10 px-5 py-3 bg-[var(--color-bg-soft)]">
              <h3 className="text-[15px] font-black tracking-tight text-[#0a1410]">
                Enregistrer comme livrable
              </h3>
              <button
                type="button"
                onClick={() => !saving && setSaveDialogOpen(false)}
                className="rounded-lg p-1.5 border border-transparent text-[#0a1410] hover:border-[#0a1410]/20 hover:bg-[#0a1410]/5 transition-colors"
                aria-label="Fermer"
              >
                <Icon name="X" size={16} />
              </button>
            </header>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!saving && saveTitle.trim()) doSave();
              }}
              className="p-5 space-y-3"
            >
              <label className="block text-xs font-black uppercase tracking-wider text-[#0a1410]">
                Titre du livrable
              </label>
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                autoFocus
                disabled={saving}
                className="w-full rounded-xl border border-[#0a1410]/20 bg-white text-[#0a1410] placeholder:text-[#7A7568] px-3 py-2.5 text-sm font-medium outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(232,70,31,0.15)] transition-all disabled:opacity-60"
                placeholder="Ex : Brief lancement Lina"
              />
              <p className="text-[11px] text-[#1e3a2c]">
                Ce livrable sera ajouté à la liste de l&apos;agent et conservé dans votre espace.
              </p>
              {saveToast?.kind === "error" && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">
                  <Icon name="AlertCircle" size={12} className="mt-0.5 shrink-0" />
                  <span>{saveToast.text}</span>
                </div>
              )}
            </form>
            <footer className="flex items-center justify-end gap-2 border-t border-[#0a1410]/10 bg-[var(--color-bg-soft)] px-5 py-3">
              <button
                type="button"
                onClick={() => setSaveDialogOpen(false)}
                disabled={saving}
                className="rounded-lg border border-[#0a1410]/20 bg-white px-3 py-1.5 text-xs font-bold text-[#0a1410] hover:bg-[#0a1410]/5 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={doSave}
                disabled={saving || !saveTitle.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--color-accent-hover)] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)] disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Icon name="Loader" size={12} className="animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Icon name="Save" size={12} /> Enregistrer
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Toast */}
      {saveToast && (
        <div
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
            saveToast.kind === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          <Icon name={saveToast.kind === "success" ? "CheckCircle" : "AlertCircle"} size={14} />
          {saveToast.text}
        </div>
      )}
    </div>
  );
}

type Part = { type: string; text?: string };

function partsToText(parts: Part[]): string {
  return parts
    .map((p) => (p.type === "text" && typeof p.text === "string" ? p.text : ""))
    .join("");
}

function summarizeDeliverable(text: string): { title: string; slideCount: number; wordCount: number; firstH2?: string } {
  const h1 = text.match(/^#\s+(.+)$/m);
  const slides = text.match(/^##\s+/gm)?.length ?? 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  const h2 = text.match(/^##\s+(?:\[[a-z]+\]\s*)?(.+)$/m);
  return {
    title: h1?.[1]?.trim() ?? "Livrable prêt",
    slideCount: slides,
    wordCount: words,
    firstH2: h2?.[1]?.trim(),
  };
}

function MessageBubble({
  role,
  parts,
  accent,
}: {
  role: string;
  parts: Part[];
  accent: "marine" | "nude" | "muted";
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black border border-white/15 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)]",
          isUser
            ? "bg-[var(--color-accent)] text-white"
            : "bg-white/[0.08] backdrop-blur-md text-[var(--color-ink)]"
        )}
      >
        {isUser ? "Z" : "AI"}
      </div>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed border shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]",
          isUser
            ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]/40"
            : "bg-white text-[#0a1410] border-[#0a1410]/10"
        )}
      >
        {parts.map((p, i) =>
          p.type === "text" && p.text ? (
            <span key={i} className="whitespace-pre-wrap">
              {p.text}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}

/**
 * Carte compacte affichée à la place d'un pavé de markdown pour une réponse
 * d'agent terminée. Montre juste le titre + quelques stats + `<details>` pour
 * accéder au markdown brut si besoin.
 */
function AssistantDeliverableCard({
  parts,
  accent,
}: {
  parts: Part[];
  accent: "marine" | "nude" | "muted";
}) {
  const text = partsToText(parts);
  if (!text.trim()) return null;
  const summary = summarizeDeliverable(text);

  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black bg-white/[0.08] backdrop-blur-md text-[#0a1410] border border-white/15 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.5)]">
        AI
      </div>
      <div
        className="rounded-2xl border border-[#0a1410]/10 bg-white text-[#0a1410] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] overflow-hidden min-w-0"
        style={{ flex: "0 0 82%", maxWidth: "82%" }}
      >
        <div className="flex items-start gap-3 px-5 py-4">
          <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white border border-emerald-400/60">
            <Icon name="CheckCircle" size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-semibold tracking-tight text-[#0a1410]">
              {summary.title}
            </div>
            <div className="mt-1 text-[12px] font-semibold text-[#1e3a2c]">
              Livrable prêt
              {summary.slideCount > 0 && <> · {summary.slideCount} slide{summary.slideCount > 1 ? "s" : ""}</>}
              {summary.wordCount > 0 && <> · {summary.wordCount} mots</>}
            </div>
            {summary.firstH2 && (
              <div className="mt-2 text-[14px] text-[#1e3a2c]">
                {summary.firstH2}
              </div>
            )}
          </div>
        </div>
        {/* Preview complète — ouverte par défaut, markdown rendu avec styles, texte vert foncé forcé */}
        <details open className="border-t border-[#0a1410]/10 bg-[#faf6ee] text-[#0a1410]">
          <summary className="cursor-pointer list-none px-5 py-2.5 text-[12px] font-semibold flex items-center gap-1.5 text-[#1e3a2c] hover:bg-[#0a1410]/5 hover:text-[#0a1410] transition-colors">
            <Icon name="ChevronDown" size={12} />
            Contenu du livrable
          </summary>
          <div className="px-6 pb-5 pt-3 border-t border-[#0a1410]/10 bg-white text-[#0a1410]">
            <MarkdownPreview text={text} />
          </div>
        </details>
      </div>
    </div>
  );
}

/**
 * Rendu markdown léger, lisible, sans dépendance externe.
 * Transforme # / ## / ### / listes / **gras** / *italique* / `code` en HTML stylé.
 * Le but : afficher un livrable comme un document, pas un dump de texte brut.
 */
function MarkdownPreview({ text }: { text: string }) {
  const blocks = useMemo(() => renderMarkdownBlocks(text), [text]);
  return (
    <div
      className="text-[15px] leading-relaxed break-words min-w-0 max-w-full"
      style={{
        color: "#0a1410",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        whiteSpace: "normal",
      }}
    >
      {blocks}
    </div>
  );
}

function renderMarkdownBlocks(raw: string): React.ReactNode {
  const lines = raw.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let codeBuffer: string[] | null = null;

  const flushList = () => {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`ul-${out.length}`} className="my-3 ml-5 list-disc space-y-1.5 text-[15px] text-[#0a1410]">
        {listBuffer.map((item, i) => (
          <li key={i} className="text-[#0a1410]">{renderInlineMd(item)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  };
  const flushCode = () => {
    if (!codeBuffer) return;
    out.push(
      <pre
        key={`code-${out.length}`}
        className="my-3 overflow-x-auto max-w-full rounded-lg border border-[#0a1410]/10 bg-[var(--color-bg-soft)] px-4 py-3 text-[13px] leading-relaxed text-[#0a1410] font-mono"
        style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        <code className="text-[#0a1410]">{codeBuffer.join("\n")}</code>
      </pre>
    );
    codeBuffer = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Code fences
    if (/^```/.test(line.trim())) {
      if (codeBuffer) {
        flushCode();
      } else {
        flushList();
        codeBuffer = [];
      }
      continue;
    }
    if (codeBuffer) {
      codeBuffer.push(line);
      continue;
    }
    // Bullets
    const bullet = line.match(/^\s*[-*•]\s+(.+)$/);
    if (bullet) {
      listBuffer.push(bullet[1]);
      continue;
    }
    flushList();
    // Titres
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      out.push(
        <h1 key={i} className="mt-6 mb-3 text-[28px] font-black tracking-tight text-[#0a1410]">
          {renderInlineMd(h1[1])}
        </h1>
      );
      continue;
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      out.push(
        <h2 key={i} className="mt-5 mb-2 text-[22px] font-black tracking-tight text-[#0a1410]">
          {renderInlineMd(h2[1])}
        </h2>
      );
      continue;
    }
    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      out.push(
        <h3 key={i} className="mt-4 mb-2 text-[17px] font-bold tracking-tight text-[#0a1410]">
          {renderInlineMd(h3[1])}
        </h3>
      );
      continue;
    }
    // HR
    if (/^-{3,}$/.test(line.trim())) {
      out.push(<hr key={i} className="my-5 border-[#0a1410]/10" />);
      continue;
    }
    // Blockquote
    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      out.push(
        <blockquote key={i} className="my-3 border-l-4 border-[#C94F3C] pl-4 italic text-[#1e3a2c]">
          {renderInlineMd(quote[1])}
        </blockquote>
      );
      continue;
    }
    // Paragraphe
    if (line.trim()) {
      out.push(
        <p key={i} className="my-2 text-[15px] leading-relaxed text-[#0a1410]">
          {renderInlineMd(line)}
        </p>
      );
    } else {
      out.push(<div key={i} className="h-2" />);
    }
  }
  flushList();
  flushCode();
  return <>{out}</>;
}

function renderInlineMd(s: string): React.ReactNode {
  // Split séquentiellement sur les tokens markdown inline (**, *, `)
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = regex.exec(s)) !== null) {
    if (match.index > last) nodes.push(s.slice(last, match.index));
    const tok = match[0];
    if (tok.startsWith("**")) {
      nodes.push(<strong key={idx++} className="font-bold text-[#0a1410]">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      nodes.push(<code key={idx++} className="rounded bg-[#0a1410]/10 px-1.5 py-0.5 font-mono text-[13px] text-[#C94F3C]">{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith("[")) {
      const m = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (m) nodes.push(<a key={idx++} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-[#C94F3C] underline hover:no-underline">{m[1]}</a>);
    } else if (tok.startsWith("*")) {
      nodes.push(<em key={idx++} className="italic text-[#1e3a2c]">{tok.slice(1, -1)}</em>);
    }
    last = match.index + tok.length;
  }
  if (last < s.length) nodes.push(s.slice(last));
  return <>{nodes}</>;
}
