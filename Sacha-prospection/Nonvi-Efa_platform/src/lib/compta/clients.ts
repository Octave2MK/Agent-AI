/**
 * Domaine « relances & facturation » (agent Chloé) — base clients Airtable.
 * Tables : Clients → Factures → Paiements.
 */
import { getRecords, AIRTABLE_CLIENTS_BASE, type AirtableRecord } from "@/lib/integrations/airtable";

export const CLIENTS_TABLE = "tblJlwGvNuAgV4SIZ";
export const FACTURES_TABLE = "tblAC41QZLUHgkHa6";
export const PAIEMENTS_TABLE = "tbllh199uIrOMw2Yi";

export type PayStatus = "Paid" | "Unpaid" | "Overdue";

export interface ClientInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  number: string;
  category: string;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string | null;
  client: ClientInfo | null;
  issueDate: string | null;
  dueDate: string | null;
  ht: number;
  tva: number;
  ttc: number;
  status: PayStatus;
  paymentDate: string | null;
  /** Jours de retard vs aujourd'hui (positif = en retard). null si payée. */
  daysOverdue: number | null;
}

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const firstLink = (v: unknown): string | null => (Array.isArray(v) && typeof v[0] === "string" ? v[0] : null);

function daysBetween(dateISO: string | null): number | null {
  if (!dateISO) return null;
  const due = new Date(dateISO + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - due.getTime()) / 86400000);
}

function toClient(r: AirtableRecord): ClientInfo {
  return {
    id: r.id,
    name: str(r.fields["Client Name"]) || "Client",
    email: str(r.fields["Email"]),
    phone: str(r.fields["Phone"]),
    address: str(r.fields["Address"]),
    number: str(r.fields["Client Number"]),
    category: str(r.fields["Client Category"]),
  };
}

export interface ComptaClientsData {
  clients: ClientInfo[];
  invoices: Invoice[];
  kpis: {
    encaisse: number; // total TTC payé
    enAttente: number; // TTC impayé (Unpaid + Overdue)
    enRetard: number; // TTC en retard (Overdue OU échéance dépassée)
    nbClients: number;
    nbFactures: number;
    nbImpayees: number;
    nbRetard: number;
  };
  /** Factures à relancer (impayées), pire retard en premier. */
  relances: Invoice[];
  /** Factures payées récemment sans confirmation envoyée — candidates à la facture auto. */
  aFacturer: Invoice[];
}

export async function getComptaClients(): Promise<ComptaClientsData> {
  const [clientRecs, factureRecs] = await Promise.all([
    getRecords(CLIENTS_TABLE, { base: AIRTABLE_CLIENTS_BASE }),
    getRecords(FACTURES_TABLE, { base: AIRTABLE_CLIENTS_BASE }),
  ]);

  const clients = clientRecs.map(toClient);
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const invoices: Invoice[] = factureRecs
    .map((r) => {
      const clientId = firstLink(r.fields["Client"]);
      const rawStatus = str(r.fields["Payment Status"]) as PayStatus;
      const status: PayStatus = rawStatus === "Paid" || rawStatus === "Overdue" ? rawStatus : "Unpaid";
      const dueDate = str(r.fields["Due Date"]) || null;
      const paid = status === "Paid";
      return {
        id: r.id,
        number: str(r.fields["Invoice Number"]) || "—",
        clientId,
        client: clientId ? clientById.get(clientId) ?? null : null,
        issueDate: str(r.fields["Issue Date"]) || null,
        dueDate,
        ht: num(r.fields["Amount (HT)"]),
        tva: num(r.fields["VAT Amount (TVA)"]),
        ttc: num(r.fields["Total (TTC)"]),
        status,
        paymentDate: str(r.fields["Payment Date"]) || null,
        daysOverdue: paid ? null : daysBetween(dueDate),
      } as Invoice;
    })
    .sort((a, b) => (b.daysOverdue ?? -9999) - (a.daysOverdue ?? -9999));

  const impayees = invoices.filter((i) => i.status !== "Paid");
  const enAttente = impayees.reduce((t, i) => t + i.ttc, 0);
  const retardList = impayees.filter((i) => i.status === "Overdue" || (i.daysOverdue ?? 0) > 0);
  const encaisse = invoices.filter((i) => i.status === "Paid").reduce((t, i) => t + i.ttc, 0);

  return {
    clients,
    invoices,
    kpis: {
      encaisse,
      enAttente,
      enRetard: retardList.reduce((t, i) => t + i.ttc, 0),
      nbClients: clients.length,
      nbFactures: invoices.length,
      nbImpayees: impayees.length,
      nbRetard: retardList.length,
    },
    relances: impayees, // déjà triées pire retard en premier
    aFacturer: invoices.filter((i) => i.status === "Paid"),
  };
}

export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const data = await getComptaClients();
  return data.invoices.find((i) => i.id === invoiceId) ?? null;
}

/** Niveau de relance suggéré selon le retard. */
export function relanceLevel(days: number | null): { level: number; label: string; tone: "amber" | "orange" | "red" } {
  const d = days ?? 0;
  if (d <= 0) return { level: 1, label: "Rappel courtois", tone: "amber" };
  if (d <= 15) return { level: 2, label: "1re relance", tone: "amber" };
  if (d <= 30) return { level: 3, label: "2e relance", tone: "orange" };
  return { level: 4, label: "Relance ferme", tone: "red" };
}
