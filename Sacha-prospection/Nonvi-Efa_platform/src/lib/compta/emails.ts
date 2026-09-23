/**
 * Modèles d'emails de relance / d'envoi de facture (agent Chloé).
 * Textes prêts à approuver — la facture PDF est jointe.
 */
import type { Invoice } from "./clients";

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const frDate = (iso: string | null) => {
  if (!iso) return "la date convenue";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

export function draftEmail(inv: Invoice): { subject: string; body: string } {
  const name = inv.client?.name ?? "";
  const hello = name ? `Bonjour ${name},` : "Bonjour,";
  const signoff = "\n\nBien à vous,\nL'équipe Nonvi-Efa Agency\nNonvi-Efaagency@gmail.com";

  if (inv.status === "Paid") {
    return {
      subject: `Votre facture ${inv.number} — Nonvi-Efa Agency`,
      body:
        `${hello}\n\nMerci pour votre règlement. Vous trouverez ci-joint votre facture acquittée ` +
        `${inv.number} d'un montant de ${eur(inv.ttc)} TTC.\n\nMerci pour votre confiance.` +
        signoff,
    };
  }

  const d = inv.daysOverdue ?? 0;
  if (d > 30) {
    return {
      subject: `Relance — facture ${inv.number} en attente de règlement`,
      body:
        `${hello}\n\nSauf erreur de notre part, la facture ${inv.number} d'un montant de ${eur(inv.ttc)} TTC, ` +
        `échue le ${frDate(inv.dueDate)}, reste impayée à ce jour (${d} jours de retard).\n\n` +
        `Nous vous remercions de bien vouloir procéder au règlement sous 8 jours. La facture est jointe à ce message. ` +
        `Si le paiement a déjà été effectué, merci de ne pas tenir compte de ce rappel.` +
        signoff,
    };
  }
  if (d > 0) {
    return {
      subject: `Rappel — facture ${inv.number} arrivée à échéance`,
      body:
        `${hello}\n\nNous nous permettons de vous rappeler que la facture ${inv.number} d'un montant de ` +
        `${eur(inv.ttc)} TTC est arrivée à échéance le ${frDate(inv.dueDate)}.\n\n` +
        `Vous trouverez la facture en pièce jointe. Merci de procéder au règlement dès que possible.` +
        signoff,
    };
  }
  return {
    subject: `Facture ${inv.number} — Nonvi-Efa Agency`,
    body:
      `${hello}\n\nVous trouverez ci-joint la facture ${inv.number} d'un montant de ${eur(inv.ttc)} TTC, ` +
      `à régler pour le ${frDate(inv.dueDate)}.\n\nN'hésitez pas si vous avez la moindre question.` +
      signoff,
  };
}
