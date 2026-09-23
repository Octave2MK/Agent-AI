"use client";

import { useState } from "react";
import { CALENDAR_WEEK, CHANNELS, DAYS } from "@/data/calendar";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";
import type { CalendarSlot } from "@/lib/types";

/**
 * CalendarGrid — Refonte Althea + interactivité.
 *
 * - **Drag & drop natif HTML5** : on peut bouger chaque publication d'une
 *   cellule à une autre (changement de jour et/ou de canal).
 * - **Click sur un slot** : ouvre une modale d'édition (titre, statut, heure,
 *   suppression). Tout reste local en mémoire (state) — la persistance backend
 *   viendra avec la connexion LinkedIn/YouTube/Email automatique.
 * - Look 100 % Althea : pastilles canaux douces, hairlines lavande, fond blanc.
 */

type Status = CalendarSlot["status"];
type Channel = (typeof CHANNELS)[number];
type SlotWithId = CalendarSlot & { id: string };

function withIds(slots: CalendarSlot[]): SlotWithId[] {
  return slots.map((s, i) => ({ ...s, id: `slot-${i}-${s.time}-${s.channel}` }));
}

// Pastille douce par canal (palette Althea-friendly)
const CHANNEL_META: Record<Channel, { icon: string; bg: string; ink: string }> = {
  LinkedIn: { icon: "Linkedin", bg: "rgba(214, 224, 244, 0.55)", ink: "#3D4E70" },
  Instagram: { icon: "Instagram", bg: "rgba(244, 220, 232, 0.55)", ink: "#8C3E5C" },
  YouTube: { icon: "Youtube", bg: "rgba(244, 218, 218, 0.55)", ink: "#883333" },
  Email: { icon: "Mail", bg: "rgba(232, 226, 244, 0.55)", ink: "#5B4A7E" },
};

const STATUS_META: Record<Status, { label: string; dot: string; ring: string; bg: string }> = {
  programmé: { label: "Programmé", dot: "#7DA9E4", ring: "rgba(125, 169, 228, 0.35)", bg: "rgba(232, 240, 252, 0.7)" },
  brouillon: { label: "Brouillon", dot: "#C9A87E", ring: "rgba(201, 168, 126, 0.35)", bg: "rgba(248, 240, 228, 0.7)" },
  publié: { label: "Publié", dot: "#7DC9A0", ring: "rgba(125, 201, 160, 0.35)", bg: "rgba(232, 248, 238, 0.7)" },
};

export function CalendarGrid({ extraSlots = [] }: { extraSlots?: CalendarSlot[] }) {
  // extraSlots = slots injectés côté serveur (ex. vidéos Instagram programmées
  // depuis le Studio vidéo de l'agente e-commerce)
  const [slots, setSlots] = useState<SlotWithId[]>(() => withIds([...CALENDAR_WEEK, ...extraSlots]));
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const [editing, setEditing] = useState<SlotWithId | null>(null);

  const byCell = new Map<string, SlotWithId[]>();
  for (const slot of slots) {
    const key = `${slot.day}::${slot.channel}`;
    const arr = byCell.get(key) ?? [];
    arr.push(slot);
    byCell.set(key, arr);
  }

  function onDragStart(e: React.DragEvent, slot: SlotWithId) {
    setDraggingId(slot.id);
    e.dataTransfer.setData("text/plain", slot.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    setDraggingId(null);
    setHoverCell(null);
  }

  function onDragOver(e: React.DragEvent, cellKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (hoverCell !== cellKey) setHoverCell(cellKey);
  }

  function onDragLeave(cellKey: string) {
    if (hoverCell === cellKey) setHoverCell(null);
  }

  function onDrop(e: React.DragEvent, day: string, channel: Channel) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, day, channel } : s)));
    setDraggingId(null);
    setHoverCell(null);
  }

  function updateSlot(id: string, patch: Partial<SlotWithId>) {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function deleteSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setEditing(null);
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      {/* ===== Header de semaine (serif éditorial) ===== */}
      <div className="px-6 py-4 border-b border-[var(--color-line)]">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="althea-eyebrow mb-1">— Semaine 17 · Lancement Davide</div>
            <h3 className="althea-headline" style={{ fontSize: "clamp(20px, 2vw, 26px)", lineHeight: 1.1 }}>
              Semaine du 20 avril — <em>{slots.length} publications.</em>
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-ink-soft)]">
            <LegendDot color={STATUS_META.programmé.dot} label="Programmé" />
            <LegendDot color={STATUS_META.brouillon.dot} label="Brouillon" />
            <LegendDot color={STATUS_META.publié.dot} label="Publié" />
          </div>
        </div>
        <p className="mt-2 text-[12px] text-[var(--color-ink-soft)] italic">
          Glissez-déposez une publication pour la déplacer · cliquez pour éditer.
        </p>
      </div>

      {/* ===== Grille ===== */}
      <div className="overflow-x-auto">
        <div className="grid min-w-[1000px]" style={{ gridTemplateColumns: "130px repeat(7, minmax(0, 1fr))" }}>
          {/* Coin haut-gauche */}
          <div className="border-b border-r border-[var(--color-line)] px-3 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-ink-soft)]">
            Canal
          </div>
          {DAYS.map((day) => {
            const parts = day.split(" ");
            const dayLabel = parts[0];
            const dayDate = parts.slice(1).join(" ");
            return (
              <div key={day} className="border-b border-r border-[var(--color-line)] px-3 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                  {dayLabel}
                </div>
                <div className="text-[13px] font-semibold text-[var(--color-ink)]">
                  {dayDate}
                </div>
              </div>
            );
          })}

          {/* Lignes par canal */}
          {CHANNELS.map((channel) => {
            const meta = CHANNEL_META[channel];
            return (
              <div key={channel} className="contents">
                {/* Cellule canal (gauche) */}
                <div
                  className="border-b border-r border-[var(--color-line)] px-3 py-3 flex items-center gap-2"
                  style={{ background: meta.bg }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.7)" }}
                  >
                    <Icon name={meta.icon} size={12} style={{ color: meta.ink }} />
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: meta.ink }}>
                    {channel}
                  </span>
                </div>
                {/* Cellules jour × canal */}
                {DAYS.map((day) => {
                  const cellKey = `${day}::${channel}`;
                  const cellSlots = byCell.get(cellKey) ?? [];
                  const isHover = hoverCell === cellKey && draggingId !== null;
                  return (
                    <div
                      key={cellKey}
                      onDragOver={(e) => onDragOver(e, cellKey)}
                      onDragLeave={() => onDragLeave(cellKey)}
                      onDrop={(e) => onDrop(e, day, channel)}
                      className={cn(
                        "border-b border-r border-[var(--color-line)] p-2 min-h-[100px] align-top transition-colors",
                        isHover && "bg-[rgba(244,240,252,0.9)]"
                      )}
                    >
                      {cellSlots.map((s) => (
                        <SlotCard
                          key={s.id}
                          slot={s}
                          dragging={draggingId === s.id}
                          onDragStart={(e) => onDragStart(e, s)}
                          onDragEnd={onDragEnd}
                          onClick={() => setEditing(s)}
                        />
                      ))}
                      {cellSlots.length === 0 && isHover && (
                        <div className="h-full flex items-center justify-center text-[11px] font-semibold text-[var(--color-ink-soft)] italic">
                          Déposer ici
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== Footer info ===== */}
      <div className="flex items-center justify-between border-t border-[var(--color-line)] px-6 py-3 text-[11px] text-[var(--color-ink-soft)] flex-wrap gap-2">
        <span className="flex items-center gap-1.5">
          <Icon name="MousePointer2" size={11} />
          Drag-and-drop actif · état local (pas encore persisté en base)
        </span>
        <span className="italic">La publication automatique arrive bientôt</span>
      </div>

      {/* ===== Modale d'édition ===== */}
      {editing && (
        <EditModal
          slot={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateSlot(editing.id, patch);
            setEditing(null);
          }}
          onDelete={() => deleteSlot(editing.id)}
        />
      )}
    </div>
  );
}

/* =================================================================
   ★ SOUS-COMPOSANTS
   ================================================================= */

function SlotCard({
  slot,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  slot: SlotWithId;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const status = STATUS_META[slot.status];
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "mb-1.5 cursor-grab active:cursor-grabbing rounded-lg p-2 text-[10px] leading-snug select-none transition-all hover:shadow-md",
        dragging && "opacity-30 scale-95"
      )}
      style={{
        background: status.bg,
        border: `1px solid ${status.ring}`,
        boxShadow: "0 1px 3px rgba(40, 35, 60, 0.06)",
      }}
      title={`${slot.title} — glisser pour déplacer, cliquer pour éditer`}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="font-mono text-[9px] font-semibold text-[var(--color-ink-soft)]">
          {slot.time}
        </span>
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: status.dot }}
          aria-label={status.label}
        />
      </div>
      <div className="font-semibold text-[var(--color-ink)] line-clamp-3">
        {slot.title}
      </div>
      <div className="mt-0.5 text-[9px] text-[var(--color-ink-soft)] truncate">
        {slot.author}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function EditModal({
  slot,
  onClose,
  onSave,
  onDelete,
}: {
  slot: SlotWithId;
  onClose: () => void;
  onSave: (patch: Partial<SlotWithId>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(slot.title);
  const [time, setTime] = useState(slot.time);
  const [status, setStatus] = useState<Status>(slot.status);
  const [author, setAuthor] = useState(slot.author);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(30, 25, 40, 0.45)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md althea-card overflow-hidden"
        style={{ borderRadius: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-[var(--color-line)]">
          <div className="althea-eyebrow mb-1.5">— Édition · {slot.channel}</div>
          <h3 className="althea-headline" style={{ fontSize: 22, lineHeight: 1.15 }}>
            Modifier la <em>publication.</em>
          </h3>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label="Titre">
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)] resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Heure">
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:30"
                className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)]"
              />
            </Field>
            <Field label="Auteur">
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-ink-soft)]"
              />
            </Field>
          </div>
          <Field label="Statut">
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(STATUS_META) as Status[]).map((s) => {
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all",
                      !active && "opacity-65 hover:opacity-100"
                    )}
                    style={{
                      background: STATUS_META[s].bg,
                      border: `1px solid ${STATUS_META[s].ring}`,
                      color: "var(--color-ink)",
                      boxShadow: active ? `0 0 0 2px ${STATUS_META[s].dot}` : undefined,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: STATUS_META[s].dot }}
                    />
                    {STATUS_META[s].label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-[var(--color-line)] bg-[var(--color-bg-soft)]">
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#A04848] hover:text-[#7E2828]"
          >
            <Icon name="Trash2" size={12} />
            Supprimer
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[12px] font-semibold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => onSave({ title, time, status, author })}
              className="althea-pill-dark"
              style={{ padding: "8px 18px", fontSize: 12 }}
            >
              <Icon name="Check" size={12} />
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-ink-soft)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
