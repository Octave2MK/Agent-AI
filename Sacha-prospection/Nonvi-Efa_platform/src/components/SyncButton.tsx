"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export interface SyncButtonProps {
  endpoint: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function SyncButton({ endpoint, label, disabled, disabledReason }: SyncButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const onClick = async () => {
    if (disabled) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setResult({
        kind: "success",
        text: `${data.synced ?? "—"} éléments synchronisés`,
      });
      startTransition(() => router.refresh());
    } catch (e) {
      setResult({
        kind: "error",
        text: e instanceof Error ? e.message : "Erreur",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setResult(null), 6000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!!disabled || loading || pending}
        title={disabled ? disabledReason : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors",
          disabled
            ? "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)] cursor-not-allowed"
            : "border-[var(--color-marine-700)] bg-[#0a1410] text-white hover:bg-[#0a1410]"
        )}
      >
        {loading ? (
          <>
            <Icon name="Loader" size={12} className="animate-spin" /> Synchronisation…
          </>
        ) : (
          <>
            <Icon name="RefreshCw" size={12} /> {label}
          </>
        )}
      </button>
      {disabled && disabledReason && (
        <span className="text-[10px] text-[var(--color-muted)] italic">{disabledReason}</span>
      )}
      {result && (
        <span
          className={cn(
            "text-[10px] font-medium",
            result.kind === "success" ? "text-emerald-700" : "text-red-700"
          )}
        >
          {result.text}
        </span>
      )}
    </div>
  );
}
