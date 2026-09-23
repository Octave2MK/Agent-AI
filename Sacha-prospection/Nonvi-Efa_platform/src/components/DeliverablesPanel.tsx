import { listDeliverables } from "@/lib/deliverables";
import { DeliverableModal } from "./DeliverableModal";
import type { AgentSlug, Deliverable } from "@/lib/types";
import { Icon } from "./Icon";

function isPdf(d: Deliverable) {
  return d.filename.toLowerCase().endsWith(".pdf");
}

export async function DeliverablesPanel({ agentSlug }: { agentSlug: AgentSlug }) {
  const items = await listDeliverables(agentSlug);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl glass-brutal">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] backdrop-blur-xl px-5 py-3">
        <div className="flex items-center gap-2 text-[14px] font-black tracking-tight text-[var(--color-ink)]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white border border-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
            <Icon name="FolderOpen" size={13} />
          </div>
          Livrables <span className="text-[var(--color-muted)] font-bold">({items.length})</span>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.08] backdrop-blur-md border border-white/15 text-[var(--color-ink)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]">
            <Icon name="Inbox" size={20} />
          </div>
          <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">Aucun livrable encore produit.</p>
          <p className="text-xs text-[var(--color-muted)]">
            Demandez à l&apos;agent de créer quelque chose, puis cliquez sur « Enregistrer » pour le garder ici.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-white/10">
          {items.map((d) => (
            <DeliverableRow key={d.filename} item={d} agentSlug={agentSlug} />
          ))}
        </ul>
      )}
    </section>
  );
}

function DeliverableRow({ item: d, agentSlug }: { item: Deliverable; agentSlug: AgentSlug }) {
  const pdf = isPdf(d);
  const version = (d.frontmatter.version as string | number | undefined)?.toString() ?? "—";
  const statut = (d.frontmatter.statut as string | undefined) ?? (pdf ? "pdf" : "draft");
  const framework = d.frontmatter.framework as string | undefined;

  const body = (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {pdf ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white border border-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
            <Icon name="FileText" size={14} />
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#0a1410] border border-white/10 shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]">
            <Icon name="File" size={14} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-black tracking-tight text-[var(--color-ink)]">{d.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-semibold text-[var(--color-muted)]">
          <span>{new Date(d.modifiedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
          <span>·</span>
          <span>{Math.round(d.bytes / 1024)} kB</span>
          {!pdf && (
            <>
              <span>·</span>
              <span>v{version}</span>
            </>
          )}
          <span>·</span>
          <span className="capitalize">{statut}</span>
          {framework && (
            <>
              <span>·</span>
              <span className="rounded-full border border-[var(--color-ink)] bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                {framework}
              </span>
            </>
          )}
        </div>
      </div>
      <Icon name={pdf ? "ExternalLink" : "ChevronRight"} size={14} className="mt-1.5 shrink-0 text-[var(--color-muted)]" />
    </div>
  );

  if (pdf) {
    // Endpoint universel qui sert les PDFs depuis le dossier de n'importe quel agent
    const pdfHref = `/api/reports/file/${encodeURIComponent(agentSlug)}/${encodeURIComponent(d.filename)}`;
    return (
      <li className="px-5 py-3 hover:bg-white/50 transition-colors">
        <a href={pdfHref} target="_blank" rel="noopener noreferrer" className="block">
          {body}
        </a>
      </li>
    );
  }

  return (
    <li className="px-5 py-3 hover:bg-white/50 transition-colors">
      <DeliverableModal agentSlug={agentSlug} slug={d.slug} title={d.title}>
        {body}
      </DeliverableModal>
    </li>
  );
}
