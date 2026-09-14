"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

interface EmailDraft {
  id: string;
  label: string;
  subject: string;
  body: string;
  to?: string;
}

function extractEmails(markdown: string): EmailDraft[] {
  // Split en sections par H2/H3/H4
  const drafts: EmailDraft[] = [];
  // Split sur les H2/H3/H4
  const sections = markdown.split(/\n(?=#{2,4}\s)/);
  let idx = 0;
  for (const section of sections) {
    const subjectMatch = section.match(/\*\*(?:Objet|Subject|Sujet)\s*(?:\*\*)?\s*[:：]\*?\*?\s*([^\n*]+)/i);
    if (!subjectMatch) continue;

    const headingMatch = section.match(/^#{2,4}\s+(.+)/);
    const label = headingMatch?.[1]?.trim() ?? `Email ${idx + 1}`;

    // Extrait TO : "**À :**" ou "**To:**" ou détecte un email direct
    const toMatch =
      section.match(/\*\*(?:À|To|Destinataire)\s*\*?\*?\s*[:：]\*?\*?\s*([^\n*<]+@[^\n*>\s]+)/i) ||
      section.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const to = toMatch?.[1]?.trim();

    // Corps : bloc ">" en priorité, sinon texte après "Corps :" ou après le subject
    const quotedLines = section.match(/(?:^|\n)>\s?[^\n]+(?:\n>\s?[^\n]*)*/g);
    let body = "";
    if (quotedLines && quotedLines.length) {
      body = quotedLines
        .join("\n")
        .split("\n")
        .map((l) => l.replace(/^\s*>\s?/, ""))
        .join("\n")
        .trim();
    } else {
      // fallback : tout ce qui vient après le subject jusqu'à la prochaine section
      const afterSubject = section.slice(subjectMatch.index! + subjectMatch[0].length);
      body = afterSubject
        .replace(/\*\*(?:Corps|Body|Message)\s*\*?\*?\s*[:：]\*?\*?/i, "")
        .replace(/\*\*(?:Notes|Remarques)[\s\S]*$/i, "")
        .trim();
    }

    if (body.length < 20) continue;

    drafts.push({
      id: `email-${idx++}`,
      label: label.slice(0, 80),
      subject: subjectMatch[1].trim(),
      body,
      to,
    });
  }
  return drafts;
}

type SendState =
  | { status: "idle" }
  | { status: "editing" }
  | { status: "sending" }
  | { status: "sent"; messageId: string }
  | { status: "error"; error: string };

export function EmailDraftsPanel({
  agentSlug,
  markdown,
}: {
  agentSlug: string;
  markdown: string;
}) {
  const drafts = useMemo(() => extractEmails(markdown), [markdown]);

  // Composants concernés : gmail, cv, fireflies (qui rédigent des mails)
  const enabled = ["gmail", "cv", "fireflies"].includes(agentSlug);
  if (!enabled || drafts.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl glass-brutal overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a1410] text-white">
            <Icon name="Send" size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0a1410]">
              Brouillons d&apos;emails détectés
            </div>
            <div className="text-[11px] text-[var(--color-muted)]">
              {drafts.length} brouillon{drafts.length > 1 ? "s" : ""} — envoi via Gmail
            </div>
          </div>
        </div>
      </header>
      <div className="p-3 space-y-3">
        {drafts.map((d) => (
          <EmailCard key={d.id} draft={d} agentSlug={agentSlug} />
        ))}
      </div>
    </div>
  );
}

function agentToArchiveFolder(agentSlug: string): "gmail" | "hiring" | "meetings" {
  if (agentSlug === "cv") return "hiring";
  if (agentSlug === "fireflies") return "meetings";
  return "gmail";
}

function EmailCard({ draft, agentSlug }: { draft: EmailDraft; agentSlug: string }) {
  const [to, setTo] = useState(draft.to ?? "");
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [state, setState] = useState<SendState>({ status: "idle" });
  const [open, setOpen] = useState(false);

  const send = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) return;
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/integrations/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body: body.trim(),
          archiveFolder: agentToArchiveFolder(agentSlug),
          tag: draft.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setState({ status: "sent", messageId: data.messageId });
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : "Erreur" });
    }
  };

  const sent = state.status === "sent";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#0a1410] truncate">
            {draft.label}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--color-muted)]">
            <Icon name="AtSign" size={10} />
            <span className={cn("truncate", !to && "italic")}>
              {to || "Destinataire à renseigner"}
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs font-medium text-[#1e3a2c]">
            {subject}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sent ? (
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <Icon name="CheckCircle" size={10} /> Envoyé
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="rounded-md border border-white/10 bg-white/[0.06] backdrop-blur-xl px-2 py-1 text-[10px] font-semibold text-[var(--color-ink)] hover:bg-white/[0.12]"
              >
                {open ? "Replier" : "Éditer"}
              </button>
              <button
                type="button"
                onClick={send}
                disabled={state.status === "sending" || !to.trim()}
                className="flex items-center gap-1 rounded-md bg-[#0a1410] px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-[#0a1410] disabled:opacity-50"
              >
                {state.status === "sending" ? (
                  <>
                    <Icon name="Loader" size={10} className="animate-spin" /> Envoi…
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={10} /> Envoyer
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
      {state.status === "error" && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-800">
          {state.error}
        </div>
      )}
      {open && !sent && (
        <div className="border-t border-white/10 bg-white/[0.025] backdrop-blur-xl p-3 space-y-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              À
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@destinataire.com"
              className="mt-0.5 w-full rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-xl text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] px-2 py-1.5 text-xs font-medium outline-none focus:border-[var(--color-accent)]/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Objet
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-xl text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] px-2 py-1.5 text-xs font-medium outline-none focus:border-[var(--color-accent)]/60"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Corps
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mt-0.5 w-full resize-y rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-xl text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] px-2 py-1.5 text-xs font-medium outline-none focus:border-[var(--color-accent)]/60 font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
