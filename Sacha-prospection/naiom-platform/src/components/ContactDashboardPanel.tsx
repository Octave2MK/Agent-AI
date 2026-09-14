"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";
import {
  parseDashboardMarkdown,
  countOpenTodos,
  urgencyBadgeColor,
  initials,
  type DashboardContact,
  type DashboardSection,
} from "@/lib/dashboard/parseDashboard";

type Mode = "fireflies" | "gmail";

const MODE_CONFIG: Record<
  Mode,
  { title: string; subtitle: (n: number) => string; entityLabel: string; listEmpty: string; accentIcon: string }
> = {
  fireflies: {
    title: "Prospects & pipeline",
    subtitle: (n) => `${n} prospect${n > 1 ? "s" : ""} analysé${n > 1 ? "s" : ""} — cliquez pour voir le détail`,
    entityLabel: "prospect",
    listEmpty: "Aucun prospect structuré détecté dans la réponse. Demandez à Fireflies un résumé avec tags `[prospect]`.",
    accentIcon: "Users",
  },
  gmail: {
    title: "Inbox à traiter",
    subtitle: (n) => `${n} contact${n > 1 ? "s" : ""} avec des threads en attente`,
    entityLabel: "contact",
    listEmpty: "Aucun contact structuré détecté dans la réponse. Demandez à Gmail un tri priorisé avec tags `[contact]`.",
    accentIcon: "Inbox",
  },
};

export function ContactDashboardPanel({
  agentSlug,
  markdown,
  mode,
}: {
  agentSlug: string;
  markdown: string;
  mode: Mode;
}) {
  const parsed = useMemo(() => parseDashboardMarkdown(markdown), [markdown]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () =>
      parsed.contacts.find((c) => c.id === selectedId) ?? parsed.contacts[0] ?? null,
    [parsed, selectedId]
  );

  // Empêche de rendre un panel vide si l'agent n'a pas (encore) produit de structure
  if (parsed.contacts.length === 0) return null;

  const cfg = MODE_CONFIG[mode];
  const totalOpenTodos = parsed.contacts.reduce((acc, c) => acc + countOpenTodos(c), 0);
  const urgentCount = parsed.contacts.filter((c) => c.urgency === "high").length;

  return (
    <div className="mt-4 rounded-2xl border border-[#0a1410]/15 bg-[#f5f1e8]/95 backdrop-blur-xl overflow-hidden shadow-[0_12px_32px_-12px_rgba(0,0,0,0.5)]">
      <header className="flex items-center justify-between gap-3 border-b border-[#0a1410]/10 bg-[#0a1410]/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white border border-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
            <Icon name={cfg.accentIcon} size={14} />
          </div>
          <div>
            <div className="text-[14px] font-black tracking-tight text-[#0a1410]">
              {cfg.title}
            </div>
            <div className="text-[11px] font-semibold text-[var(--color-muted)]">
              {cfg.subtitle(parsed.contacts.length)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          {urgentCount > 0 && (
            <span className="rounded-full border border-white/10 bg-red-500 px-2 py-0.5 font-black uppercase tracking-wider text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
              {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
            </span>
          )}
          {totalOpenTodos > 0 && (
            <span className="rounded-full border border-white/10 bg-white/80 px-2 py-0.5 font-black uppercase tracking-wider text-[#0a1410] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
              {totalOpenTodos} to-do
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] min-h-[420px]">
        {/* Sidebar liste */}
        <nav
          className="border-b-2 md:border-b-0 md:border-r border-[#0a1410]/10 bg-[#0a1410]/[0.03] max-h-[560px] overflow-y-auto"
          aria-label={`Liste des ${cfg.entityLabel}s`}
        >
          <ul className="divide-y divide-[#0a1410]/10">
            {parsed.contacts.map((c) => {
              const isActive = selected?.id === c.id;
              const openTodos = countOpenTodos(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition-all",
                      isActive
                        ? "bg-white border-l-[3px] border-[var(--color-accent)]"
                        : "hover:bg-white/60 border-l-[3px] border-transparent"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black border border-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]",
                        isActive
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-white text-[#0a1410]"
                      )}
                      aria-hidden
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-black tracking-tight text-[#0a1410]">
                          {c.name}
                        </span>
                        {c.urgency === "high" && (
                          <span
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500 border border-[var(--color-ink)]"
                            aria-label="urgence haute"
                          />
                        )}
                      </div>
                      {c.company && (
                        <div className="truncate text-[11px] font-medium text-[var(--color-muted)]">
                          {c.company}
                          {c.role ? ` · ${c.role}` : ""}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5 text-[9px]">
                        {c.status && (
                          <span className="rounded-full border border-[var(--color-ink)] bg-white/80 px-1.5 py-0.5 font-black uppercase tracking-wider text-[#0a1410]">
                            {c.status}
                          </span>
                        )}
                        {openTodos > 0 && (
                          <span className="rounded-full border border-[var(--color-ink)] bg-amber-300 px-1.5 py-0.5 font-black uppercase tracking-wider text-[#0a1410]">
                            {openTodos} to-do
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pane détail */}
        {selected ? (
          <ContactDetail contact={selected} />
        ) : (
          <div className="flex items-center justify-center p-8 text-xs text-[var(--color-muted)]">
            {cfg.listEmpty}
          </div>
        )}
      </div>

      {agentSlug === "gmail" && (
        <div className="border-t border-[#0a1410]/10 bg-[#0a1410]/5 px-4 py-2 text-[10px] font-semibold text-[#1e3a2c]">
          Astuce : pour envoyer directement un draft, descendez dans le panneau « Brouillons d&apos;emails détectés ».
        </div>
      )}
    </div>
  );
}

function ContactDetail({ contact }: { contact: DashboardContact }) {
  return (
    <div className="flex flex-col bg-transparent">
      {/* Header prospect/contact */}
      <div className="border-b border-[#0a1410]/10 bg-[#0a1410]/[0.02] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-black tracking-tight text-[#0a1410] leading-tight">
              {contact.name}
            </h3>
            {(contact.company || contact.role) && (
              <div className="mt-1 text-[12px] font-semibold text-[var(--color-muted)]">
                {[contact.company, contact.role].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {contact.urgency && (
              <span
                className={cn(
                  "rounded-full border border-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]",
                  contact.urgency === "high"
                    ? "bg-red-500 text-white"
                    : contact.urgency === "medium"
                    ? "bg-amber-400 text-[#0a1410]"
                    : "bg-emerald-200 text-[#0a1410]"
                )}
              >
                {contact.urgency === "high"
                  ? "urgent"
                  : contact.urgency === "medium"
                  ? "à surveiller"
                  : "peu prio"}
              </span>
            )}
            {contact.status && (
              <span className="rounded-full border border-white/10 bg-white/[0.08] backdrop-blur-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#0a1410] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
                {contact.status}
              </span>
            )}
          </div>
        </div>
        {(contact.lastContact || Object.keys(contact.extraFields).length > 0) && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:grid-cols-3">
            {contact.lastContact && (
              <MetaField label="Dernier contact" value={contact.lastContact} />
            )}
            {Object.entries(contact.extraFields)
              .slice(0, 5)
              .map(([k, v]) => (
                <MetaField key={k} label={k} value={v} />
              ))}
          </dl>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4 p-5">
        {contact.sections.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#0a1410]/20 bg-[#0a1410]/[0.03] p-4 text-center text-xs text-[#1e3a2c]">
            Aucune section détaillée. Demandez à l&apos;agent de compléter avec `### Calls`, `### To-do`, `### Relance`.
          </div>
        )}
        {contact.sections.map((section) => (
          <SectionBlock key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </dt>
      <dd className="truncate text-[12px] font-bold text-[#0a1410]">
        {value}
      </dd>
    </div>
  );
}

function sectionIcon(key: string): string {
  if (key.includes("call") || key.includes("meeting") || key.includes("reunion")) return "Video";
  if (key.includes("thread") || key.includes("mail") || key.includes("email")) return "Inbox";
  if (key.includes("todo") || key.includes("to-do") || key.includes("action") || key.includes("tache")) return "ListChecks";
  if (key.includes("relance") || key.includes("followup") || key.includes("follow-up")) return "Send";
  if (key.includes("draft") || key.includes("brouillon") || key.includes("message")) return "Mail";
  if (key.includes("note")) return "FileText";
  return "ChevronRight";
}

function SectionBlock({ section }: { section: DashboardSection }) {
  const hasTodos = section.todos.length > 0;
  const hasBullets = section.bullets.length > 0;
  const hasFields = Object.keys(section.fields).length > 0;
  const hasBody = !!section.body;

  return (
    <section className="rounded-xl border border-[#0a1410]/15 bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2 border-b border-[#0a1410]/10 bg-[#0a1410]/5 px-4 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-accent)] text-white border border-[#0a1410]/20">
          <Icon name={sectionIcon(section.key)} size={12} />
        </div>
        <h4 className="text-xs font-black uppercase tracking-[0.14em] text-[#0a1410]">
          {section.label}
        </h4>
        <span className="ml-auto text-[10px] font-black text-[var(--color-muted)]">
          {hasTodos
            ? `${section.todos.filter((t) => !t.done).length}/${section.todos.length}`
            : hasBullets
            ? `${section.bullets.length} items`
            : ""}
        </span>
      </div>
      <div className="space-y-3 px-4 py-3">
        {hasTodos && <TodoList todos={section.todos} />}
        {hasBullets && <BulletList items={section.bullets} />}
        {hasFields && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] md:grid-cols-3">
            {Object.entries(section.fields).map(([k, v]) => (
              <MetaField key={k} label={k} value={v} />
            ))}
          </dl>
        )}
        {hasBody && (
          <div className="rounded-lg border border-[#0a1410]/10 bg-[#0a1410]/[0.03] p-3 text-[12px] leading-relaxed text-[#0a1410] whitespace-pre-wrap">
            {section.body}
          </div>
        )}
      </div>
    </section>
  );
}

function TodoList({ todos }: { todos: { text: string; done: boolean; assignee?: string; deadline?: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {todos.map((t, i) => (
        <li
          key={i}
          className={cn(
            "flex items-start gap-2.5 rounded-lg px-2 py-1 text-[12px]",
            t.done ? "text-[var(--color-muted)] line-through" : "text-[#0a1410] font-medium"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-[#0a1410]/20",
              t.done
                ? "bg-[var(--color-accent)] text-white"
                : "bg-white text-[#0a1410]"
            )}
            aria-hidden
          >
            {t.done && <Icon name="Check" size={10} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate">{t.text}</div>
            {(t.assignee || t.deadline) && (
              <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-[var(--color-muted)]">
                {t.assignee && (
                  <span className="inline-flex items-center gap-1">
                    <Icon name="User" size={9} /> {t.assignee}
                  </span>
                )}
                {t.deadline && (
                  <span className="inline-flex items-center gap-1 text-[var(--color-accent)]">
                    <Icon name="Calendar" size={9} /> {t.deadline}
                  </span>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-[12px] text-[#0a1410] font-medium">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-accent)] border border-[var(--color-ink)]" />
          <span className="flex-1 leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
