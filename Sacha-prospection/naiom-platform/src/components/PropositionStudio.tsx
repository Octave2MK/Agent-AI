"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export interface PropCall {
  id: string; title: string; date: string; type: string; participants: string[]; summary: string;
}

interface GenResult {
  prospect: string; reference: string; filename: string; downloadUrl: string;
  email: { subject: string; body: string };
}

const INTERNAL = /zeyneb|maxim|naiom/i;

export function PropositionStudio({ calls: allCalls }: { calls: PropCall[] }) {
  const calls = allCalls.filter((c) => c.type !== "interne");
  const [selected, setSelected] = useState<string | null>(calls[0]?.id ?? null);
  const [gen, setGen] = useState(false);
  const [res, setRes] = useState<GenResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const call = calls.find((c) => c.id === selected) ?? null;
  // Affiche l'ENTREPRISE (entre parenthèses dans le titre) plutôt que le contact.
  const prospectOf = (c: PropCall) => {
    const paren = c.title.match(/\(([^),]+)/)?.[1]?.trim();
    if (paren) return paren;
    return c.participants.find((p) => !INTERNAL.test(p)) ?? c.title.replace(/^.*?—\s*/, "").split("(")[0].trim();
  };

  async function generate() {
    if (!selected) return;
    setGen(true); setErr(null); setRes(null); setSent(null);
    try {
      const r = await fetch("/api/propositions/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ callId: selected }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Génération impossible");
      setRes(j); setSubject(j.email?.subject ?? `Proposition — ${j.prospect}`); setMessage(j.email?.body ?? "");
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); } finally { setGen(false); }
  }

  async function send() {
    if (!res) return;
    setSending(true); setErr(null); setSent(null);
    try {
      const r = await fetch("/api/propositions/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: res.filename, to, subject, message }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Envoi impossible");
      setSent(`Proposition envoyée à ${to} ✓`);
    } catch (e) { setErr(e instanceof Error ? e.message : "Erreur"); } finally { setSending(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black tracking-tight text-[var(--color-ink)]">Studio Proposition — Victor</h2>
        <p className="text-[13px] text-[var(--color-muted)]">Branché à <b>Fireflies</b> : choisis un call, Victor analyse les process et rédige une proposition chiffrée. PDF à gauche, email à droite.</p>
      </div>

      {/* 1 · call */}
      <div>
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">1 · Choisis le prospect (call Fireflies)</div>
        {calls.length === 0 ? (
          <div className="althea-card p-4 text-[13px] text-[var(--color-muted)]">Aucun call disponible.</div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {calls.map((c) => (
              <button key={c.id} onClick={() => { setSelected(c.id); setRes(null); setSent(null); }}
                className={cn("text-left althea-card p-3 transition hover-lift", selected === c.id ? "border-2 border-[var(--color-accent)]/50" : "border border-[var(--color-line)]")}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="chip emerald text-[10px]"><Icon name="Mic" size={10} /> {c.type}</span>
                  <span className="text-[11px] text-[var(--color-muted)]">{new Date(c.date).toLocaleDateString("fr-FR")}</span>
                </div>
                <div className="text-[13px] font-bold leading-tight text-[var(--color-ink)]">{prospectOf(c)}</div>
                <div className="mt-0.5 line-clamp-2 text-[11.5px] text-[var(--color-muted)]">{c.summary}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2 · generate */}
      <div>
        <button onClick={generate} disabled={!selected || gen}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-40">
          <Icon name={gen ? "Loader" : "FileSignature"} size={14} className={gen ? "animate-spin" : ""} />
          {gen ? "Victor analyse et rédige…" : call ? `Générer la proposition pour ${prospectOf(call)}` : "Générer la proposition"}
        </button>
      </div>

      {err && <div className="althea-card border-red-300 p-3 text-[13px] text-red-600">{err}</div>}

      {/* 3 · two-pane */}
      {res && (
        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          {/* LEFT: PDF */}
          <div className="althea-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-2">
              <div className="flex items-center gap-2 text-[12px] font-black text-[var(--color-ink)]"><Icon name="FileText" size={13} /> {res.reference}</div>
              <div className="flex items-center gap-3">
                <button onClick={() => setFull(true)} className="text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">Plein écran ↗</button>
                <a href={res.downloadUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-[var(--color-muted)] hover:text-[var(--color-ink)]">Télécharger</a>
              </div>
            </div>
            <iframe src={`${res.downloadUrl}#toolbar=1&view=FitH`} title="Proposition" className="h-[560px] w-full bg-black/5" />
          </div>

          {/* RIGHT: email */}
          <div className="althea-card p-4">
            <div className="mb-3 flex items-center gap-2 text-[12px] font-black text-[var(--color-ink)]"><Icon name="Mail" size={14} /> Email au prospect</div>
            <p className="mb-3 text-[11px] text-[var(--color-muted)]">Ce message accompagne le PDF — il n&apos;est pas dans le document. Modifie-le librement avant d&apos;envoyer.</p>
            <Field label="À"><input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@prospect.com" className="pinput" /></Field>
            <Field label="Objet"><input value={subject} onChange={(e) => setSubject(e.target.value)} className="pinput" /></Field>
            <Field label="Message"><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={11} className="pinput resize-none" /></Field>
            <div className="mt-3 flex items-center justify-between">
              {sent ? <span className="text-[13px] font-bold text-emerald-600">{sent}</span> : <span className="text-[11px] text-[var(--color-muted)]">PDF joint : {res.filename}</span>}
              <button onClick={send} disabled={sending || !to}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-40">
                <Icon name={sending ? "Loader" : "Send"} size={14} className={sending ? "animate-spin" : ""} />
                {sending ? "Envoi…" : "Approuver & envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {full && res && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70 p-4" onClick={() => setFull(false)}>
          <div className="mb-2 flex justify-end"><button onClick={() => setFull(false)} className="rounded-lg bg-white px-3 py-1.5 text-[13px] font-bold">Fermer ✕</button></div>
          <iframe src={res.downloadUrl} title="Proposition plein écran" className="w-full flex-1 rounded-lg bg-white" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx>{`.pinput{width:100%;border:1px solid var(--color-line);border-radius:10px;padding:9px 11px;font-size:13px;background:var(--color-bg);color:var(--color-ink);margin-bottom:2px}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-2"><div className="mb-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--color-muted)]">{label}</div>{children}</div>;
}
