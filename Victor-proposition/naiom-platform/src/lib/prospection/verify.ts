import { resolveMx } from "node:dns/promises";

/**
 * Vérifie qu'une liste d'emails est plausiblement délivrable : au moins un
 * domaine possède un enregistrement MX (serveur de mails). Ce n'est pas un
 * envoi de test, mais ça élimine les fautes de frappe et domaines morts.
 */
export async function verifyEmails(emails: string[]): Promise<boolean> {
  const domains = [
    ...new Set(
      emails
        .map((e) => e.split("@")[1]?.toLowerCase().trim())
        .filter((d): d is string => Boolean(d))
    ),
  ];
  for (const domain of domains) {
    try {
      const mx = await resolveMx(domain);
      if (mx.length > 0) return true;
    } catch {
      // domaine sans MX ou injoignable → on continue avec le suivant
    }
  }
  return false;
}
