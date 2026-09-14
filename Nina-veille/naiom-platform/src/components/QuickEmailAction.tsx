"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export interface QuickEmailActionProps {
  label: string; // texte du bouton
  icon?: string;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  // Données pour générer l'email via Claude
  purpose: string; // ex. "Envoyer un refus respectueux au candidat"
  context: string; // infos à passer (nom, poste, etc.)
  tone?: string;
  defaultTo?: string; // destinataire pré-rempli
  archiveFolder?: "gmail" | "hiring" | "meetings";
  tag?: string;
  onSent?: () => void;
}

type State =
  | { kind: "idle" }
  | { kind: "generating" }
  | { kind: "editing"; subject: string; body: string; to: string }
  | { kind: "sending"; subject: string; body: string; to: string }
  | { kind: "sent" }
  | { kind: "error"; message: string };

export function QuickEmailAction(props: QuickEmailActionProps) {
  const [state, setState] = useState<State>({ kind: "idle" });

  const start = async () => {
    setState({ kind: "generating" });
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: props.purpose,
          context: props.context,
          tone: props.tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState({
        kind: "editing",
        subject: data.subject,
        body: data.body,
        to: props.defaultTo ?? "",
      });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Erreur" });
    }
  };

  const send = async () => {
    if (state.kind !== "editing") return;
    if (!state.to.trim()) return;
    setState({ ...state, kind: "sending" });
    try {
      const res = await fetch("/api/integrations/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: state.to.trim(),
          subject: state.subject,
          body: state.body,
          archiveFolder: props.archiveFolder,
          tag: props.tag ?? props.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState({ kind: "sent" });
      props.onSent?.();
      setTimeout(() => setState({ kind: "idle" }), 4000);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Erreur" });
    }
  };

  const buttonClass = cn(
    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors",
    props.variant === "danger"
      ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
      : props.variant === "secondary"
      ? "border border-[var(--color-line)] bg-white text-[#0a1410] hover:bg-[var(--color-marine-50)]"
      : "bg-[#0a1410] text-white hover:bg-[#0a1410]"
  );

  return (
    <>
      {state.kind === "sent" ? (
        <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700">
          <Icon name="CheckCircle" size={10} /> Envoyé
        </span>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={
            props.disabled ||
            state.kind === "generating" ||
            state.kind === "sending"
          }
          className={buttonClass}
        >
          {state.kind === "generating" ? (
            <>
              <Icon name="Loader" size={10} className="animate-spin" /> Rédaction…
            </>
          ) : (
            <>
              <Icon name={props.icon ?? "Send"} size={10} />
              {props.label}
            </>
          )}
        </button>
      )}

      {/* Modal */}
      {(state.kind === "editing" || state.kind === "sending") && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => state.kind === "editing" && setState({ kind: "idle" })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl max-h-[90vh]"
          >
            <header className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a1410] text-white">
                  <Icon name="Send" size={14} />
                </div>
                <h2 className="text-sm font-semibold text-[#0a1410]">
                  {props.label} — rédaction automatique
                </h2>
              </div>
              <button
                type="button"
                onClick={() => state.kind === "editing" && setState({ kind: "idle" })}
                disabled={state.kind === "sending"}
                className="rounded p-1 hover:bg-[var(--color-marine-50)]"
              >
                <Icon name="X" size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  À
                </label>
                <input
                  type="email"
                  value={state.to}
                  onChange={(e) => setState({ ...state, to: e.target.value })}
                  disabled={state.kind === "sending"}
                  placeholder="email@destinataire.com"
                  className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-marine-700)] disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  Objet
                </label>
                <input
                  type="text"
                  value={state.subject}
                  onChange={(e) => setState({ ...state, subject: e.target.value })}
                  disabled={state.kind === "sending"}
                  className="mt-1 w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-marine-700)] disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  Corps
                </label>
                <textarea
                  value={state.body}
                  onChange={(e) => setState({ ...state, body: e.target.value })}
                  disabled={state.kind === "sending"}
                  rows={12}
                  className="mt-1 w-full resize-y rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-marine-700)] disabled:opacity-60 font-sans"
                />
              </div>
            </div>

            <footer className="flex items-center justify-between gap-2 border-t border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3">
              <span className="text-[11px] text-[var(--color-muted)]">
                Archivé dans{" "}
                <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px]">
                  {props.archiveFolder ?? "gmail"}/
                </code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setState({ kind: "idle" })}
                  disabled={state.kind === "sending"}
                  className="rounded-md border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs text-[#0a1410] hover:bg-[var(--color-marine-50)] disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={state.kind === "sending" || !state.to.trim()}
                  className="flex items-center gap-1.5 rounded-md bg-[#0a1410] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a1410] disabled:opacity-50"
                >
                  {state.kind === "sending" ? (
                    <>
                      <Icon name="Loader" size={12} className="animate-spin" /> Envoi…
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={12} /> Envoyer
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <span className="ml-2 text-[10px] text-red-700">{state.message}</span>
      )}
    </>
  );
}
