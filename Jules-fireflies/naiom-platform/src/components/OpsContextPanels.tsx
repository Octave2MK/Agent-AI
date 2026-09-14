import { getInbox, getMeetings, getCandidates } from "@/lib/dataSources";
import { Icon } from "./Icon";
import { QuickEmailAction } from "./QuickEmailAction";
import { cn } from "@/lib/utils";

function LiveBadge({ live, lastUpdated }: { live: boolean; lastUpdated?: string }) {
  if (live) {
    const rel = lastUpdated
      ? new Date(lastUpdated).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      : "—";
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Connecté · {rel}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--color-nude-100)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-nude-500)] border border-[var(--color-nude-200)]">
      Démo (non connecté)
    </span>
  );
}

// ---- INBOX PANEL (Gmail) ----

export async function InboxPreview() {
  const { data: inbox, live, lastUpdated } = await getInbox();
  const urgent = inbox.filter((e) => e.urgency === "high").length;
  const toReply = inbox.filter((e) => e.requiresReply).length;

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0a1410]">
          <Icon name="Inbox" size={16} />
          Boîte de réception
        </div>
        <LiveBadge live={live} lastUpdated={lastUpdated} />
      </header>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2 text-[11px]">
        <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
          {urgent} urgent{urgent > 1 ? "s" : ""}
        </span>
        <span className="rounded-full bg-[var(--color-marine-50)] px-2 py-0.5 font-semibold text-[#0a1410]">
          {toReply} à répondre
        </span>
        <span className="ml-auto text-[var(--color-muted)]">{inbox.length} au total</span>
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-line)] max-h-[380px]">
        {inbox.slice(0, 7).map((e) => (
          <li key={e.id} className="px-4 py-2.5 hover:bg-[var(--color-marine-50)]/50">
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                  e.urgency === "high" && "bg-red-500",
                  e.urgency === "medium" && "bg-[var(--color-nude-500)]",
                  e.urgency === "low" && "bg-[var(--color-marine-200)]"
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-[#0a1410]">
                    {e.from}
                  </span>
                  <span className="shrink-0 text-[10px] text-[var(--color-muted)]">
                    {new Date(e.receivedAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="truncate text-[12px] text-[#1e3a2c]">
                  {e.subject}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                  {e.preview}
                </div>
              </div>
            </div>
          </li>
        ))}
        {inbox.length > 7 && (
          <li className="px-4 py-2 text-center text-[11px] text-[var(--color-muted)]">
            + {inbox.length - 7} autres emails dans le contexte de l'agent
          </li>
        )}
      </ul>
    </section>
  );
}

// ---- MEETINGS PANEL (Fireflies) ----

export async function MeetingsPreview() {
  const { data: meetings, live, lastUpdated } = await getMeetings();
  const upcoming = meetings.filter((m) => new Date(m.date) > new Date());
  const past = meetings.filter((m) => new Date(m.date) <= new Date());

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0a1410]">
          <Icon name="Mic" size={16} />
          Calls récents
        </div>
        <LiveBadge live={live} lastUpdated={lastUpdated} />
      </header>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2 text-[11px] text-[var(--color-muted)]">
        {meetings.length} calls · {past.length} passés · {upcoming.length} à venir
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-line)] max-h-[480px]">
        {past.slice(0, 6).map((m) => {
          // Extrait un email destinataire : premier participant non-NAIOM
          const externalParticipant = m.participants.find(
            (p) =>
              !p.toLowerCase().includes("naiomagency") &&
              !p.toLowerCase().includes("zeyneb") &&
              !p.toLowerCase().includes("maxim") &&
              p.includes("@")
          );
          const ctxRelance = `Call: "${m.title}"\nDate: ${m.date}\nParticipants: ${m.participants.join(", ")}\nRésumé: ${m.summary}\nPoints clés: ${m.keyPoints.slice(0, 3).join(" / ")}\nAction items existants: ${m.actionItems.slice(0, 3).join(" / ")}`;
          return (
            <li key={m.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1 inline-block h-2 w-2 shrink-0 rounded-full",
                    m.sentiment === "positive" && "bg-emerald-500",
                    m.sentiment === "neutral" && "bg-[var(--color-marine-400)]",
                    m.sentiment === "negative" && "bg-red-500"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-[#0a1410]">
                      {m.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--color-muted)]">
                      {new Date(m.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                    {m.durationMin} min · {m.type} · {m.participants.length} pers.
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#1e3a2c]">
                    {m.summary}
                  </p>
                  {m.actionItems.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <QuickEmailAction
                        label="Relancer"
                        icon="Send"
                        variant="primary"
                        purpose={`Rédige un email de relance post-call, court et actionnable. Résume les 2-3 décisions clés, rappelle la prochaine étape, propose un créneau. Ne réexplique pas tout — le prospect a participé au call.`}
                        context={ctxRelance}
                        defaultTo={externalParticipant ?? ""}
                        archiveFolder="meetings"
                        tag={`Relance ${m.title.slice(0, 40)}`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---- CANDIDATES PANEL (CV) ----

export async function CandidatesPreview() {
  const { data, live, lastUpdated } = await getCandidates();
  const { candidates, jobs } = data;

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#0a1410]">
          <Icon name="Users" size={16} />
          Candidatures
        </div>
        <LiveBadge live={live} lastUpdated={lastUpdated} />
      </header>

      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        {jobs.length} postes · {candidates.length} candidats
      </div>
      <ul className="divide-y divide-[var(--color-line)]">
        {jobs.map((j) => {
          const count = candidates.filter((c) => c.appliedFor === j.id).length;
          return (
            <li key={j.id} className="px-4 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold text-[#0a1410]">{j.title}</div>
                  <div className="text-[11px] text-[var(--color-muted)]">
                    {j.seniority} · {j.location} · {j.salaryRange}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-marine-50)] px-2 py-0.5 text-[10px] font-semibold text-[#0a1410]">
                  {count} cand.
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-y border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
        Top candidats
      </div>
      <ul className="flex-1 overflow-y-auto divide-y divide-[var(--color-line)] max-h-[380px]">
        {candidates.map((c) => {
          const job = jobs.find((j) => j.id === c.appliedFor);
          const ctxApprove = `Candidat: ${c.fullName}\nPoste visé: ${job?.title ?? c.appliedFor}\nExpérience: ${c.yearsXp} ans chez ${c.currentCompany} (${c.currentRole})\nSkills: ${c.skills.join(", ")}\nForces: ${c.highlights.join(" / ")}\nPrétention salariale: ${c.salaryExpectation}\nDispo: ${c.availability}`;
          const ctxReject = `${ctxApprove}\nRaisons de non-sélection: ${c.redFlags.join(" / ")}\n\nObjectif: refus respectueux, valoriser ce qui était bon, laisser porte ouverte pour un futur poste.`;
          return (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-nude-200)] text-[11px] font-bold text-[#1e3a2c]">
                  {c.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[#0a1410]">
                    {c.fullName}
                  </div>
                  <div className="truncate text-[11px] text-[var(--color-muted)]">
                    {c.yearsXp} ans · {c.currentRole} @ {c.currentCompany}
                  </div>
                  <div className="mt-0.5 text-[10px] text-[var(--color-muted)]">
                    Postule : {job?.title}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <QuickEmailAction
                      label="Approuver"
                      icon="UserCheck"
                      variant="primary"
                      purpose={`Rédige un email d'invitation à un entretien pour un candidat retenu sur le poste "${job?.title ?? c.appliedFor}". L'email doit être chaleureux, annoncer la bonne nouvelle, proposer 2 créneaux cette semaine, préciser que l'entretien durera 45 minutes.`}
                      context={ctxApprove}
                      tone="chaleureux, enthousiaste, professionnel"
                      defaultTo={c.email}
                      archiveFolder="hiring"
                      tag={`Approbation ${c.fullName}`}
                    />
                    <QuickEmailAction
                      label="Refuser"
                      icon="X"
                      variant="danger"
                      purpose={`Rédige un email de refus RESPECTUEUX et ENCOURAGEANT pour un candidat non retenu sur le poste "${job?.title ?? c.appliedFor}". Valorise ce qui était bon dans son profil, explique brièvement que ce poste demande un fit différent, laisse la porte ouverte pour un futur poste.`}
                      context={ctxReject}
                      tone="respectueux, empathique, honnête"
                      defaultTo={c.email}
                      archiveFolder="hiring"
                      tag={`Refus ${c.fullName}`}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
