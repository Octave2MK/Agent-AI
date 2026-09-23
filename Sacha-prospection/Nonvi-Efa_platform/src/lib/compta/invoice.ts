/**
 * Génère une facture PDF de marque Nonvi-Efa à partir d'une facture Airtable.
 * A4 portrait, une page. Sauvegardée dans le dossier de livrables `compta/`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";
import { DELIVERABLE_FOLDERS } from "@/lib/paths";
import type { Invoice } from "./clients";

const ISSUER = {
  name: "Nonvi-Efa Agency",
  tagline: "Ingénierie d'agents IA & automatisations",
  email: "Nonvi-Efaagency@gmail.com",
  color: "#F5411C",
  ink: "#1A1A1A",
};

const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);
const frDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
};

const STATUS_FR: Record<string, { label: string; bg: string; fg: string }> = {
  Paid: { label: "PAYÉE", bg: "#DCFCE7", fg: "#15803D" },
  Unpaid: { label: "À RÉGLER", bg: "#FEF3C7", fg: "#B45309" },
  Overdue: { label: "EN RETARD", bg: "#FEE2E2", fg: "#B91C1C" },
};

function renderInvoiceHTML(inv: Invoice): string {
  const c = inv.client;
  const st = STATUS_FR[inv.status] ?? STATUS_FR.Unpaid;
  const label = inv.status === "Paid" ? "Facture" : "Facture à régler";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Archivo','Helvetica Neue',Arial,sans-serif; color: ${ISSUER.ink}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; min-height: 297mm; padding: 22mm 20mm; position: relative; }
.top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${ISSUER.color}; padding-bottom: 18px; }
.brand { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.brand .dot { color: ${ISSUER.color}; }
.tagline { font-size: 11px; color: #6b7280; margin-top: 2px; }
.docmeta { text-align: right; }
.doctitle { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
.badge { display: inline-block; margin-top: 8px; padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; background: ${st.bg}; color: ${st.fg}; }
.parties { display: flex; justify-content: space-between; gap: 30px; margin-top: 30px; }
.party { flex: 1; }
.plabel { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: ${ISSUER.color}; margin-bottom: 8px; }
.pname { font-size: 15px; font-weight: 700; }
.pline { font-size: 12px; color: #4b5563; margin-top: 2px; }
.meta { display: flex; gap: 26px; margin-top: 26px; }
.meta div { font-size: 12px; }
.meta .k { color: #6b7280; text-transform: uppercase; font-size: 9px; letter-spacing: 0.1em; font-weight: 700; }
.meta .v { font-weight: 700; margin-top: 3px; font-size: 13px; }
table { width: 100%; border-collapse: collapse; margin-top: 26px; }
th { background: #FAF6F4; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; padding: 11px 14px; }
th.r, td.r { text-align: right; }
td { padding: 14px; border-bottom: 1px solid #eee; font-size: 13px; }
.desc { font-weight: 600; }
.totals { margin-top: 22px; margin-left: auto; width: 46%; }
.trow { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
.trow.grand { border-top: 2px solid ${ISSUER.ink}; margin-top: 6px; padding-top: 12px; font-size: 18px; font-weight: 800; }
.trow.grand .amt { color: ${ISSUER.color}; }
.note { margin-top: 40px; padding: 16px 18px; background: #FAF6F4; border-left: 3px solid ${ISSUER.color}; font-size: 12px; color: #4b5563; border-radius: 4px; }
.foot { position: absolute; bottom: 18mm; left: 20mm; right: 20mm; border-top: 1px solid #eee; padding-top: 12px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; }
</style></head><body>
<div class="page">
  <div class="top">
    <div>
      <div class="brand">Nonvi-Efa<span class="dot">.</span></div>
      <div class="tagline">${ISSUER.tagline}</div>
    </div>
    <div class="docmeta">
      <div class="doctitle">${label}</div>
      <div class="badge">${st.label}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="plabel">Émetteur</div>
      <div class="pname">${ISSUER.name}</div>
      <div class="pline">${ISSUER.email}</div>
    </div>
    <div class="party">
      <div class="plabel">Facturé à</div>
      <div class="pname">${c?.name ?? "Client"}</div>
      ${c?.number ? `<div class="pline">Réf. client : ${c.number}</div>` : ""}
      ${c?.address ? `<div class="pline">${c.address}</div>` : ""}
      ${c?.email ? `<div class="pline">${c.email}</div>` : ""}
    </div>
  </div>

  <div class="meta">
    <div><div class="k">N° de facture</div><div class="v">${inv.number}</div></div>
    <div><div class="k">Date d'émission</div><div class="v">${frDate(inv.issueDate)}</div></div>
    <div><div class="k">Échéance</div><div class="v">${frDate(inv.dueDate)}</div></div>
    ${inv.status === "Paid" && inv.paymentDate ? `<div><div class="k">Payée le</div><div class="v">${frDate(inv.paymentDate)}</div></div>` : ""}
  </div>

  <table>
    <thead><tr><th>Description</th><th class="r">Montant HT</th></tr></thead>
    <tbody>
      <tr><td class="desc">Prestation Nonvi-Efa — ${c?.category ? c.category : "services"}</td><td class="r">${eur(inv.ht)}</td></tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="trow"><span>Total HT</span><span>${eur(inv.ht)}</span></div>
    <div class="trow"><span>TVA</span><span>${eur(inv.tva)}</span></div>
    <div class="trow grand"><span>Total TTC</span><span class="amt">${eur(inv.ttc)}</span></div>
  </div>

  <div class="note">
    ${
      inv.status === "Paid"
        ? "Facture acquittée — merci pour votre confiance. Ce document tient lieu de reçu."
        : `Règlement à réception, au plus tard le ${frDate(inv.dueDate)}. Par virement à ${ISSUER.email}. Merci de rappeler le n° ${inv.number}.`
    }
  </div>

  <div class="foot">
    <span>${ISSUER.name} — ${ISSUER.email}</span>
    <span>Facture ${inv.number}</span>
  </div>
</div>
</body></html>`;
}

export async function generateInvoicePDF(inv: Invoice): Promise<{ path: string; filename: string; bytes: number }> {
  const folder = DELIVERABLE_FOLDERS.comptabilite;
  const html = renderInvoiceHTML(inv);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    await Promise.race([
      page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => true)),
      new Promise((r) => setTimeout(r, 4000)),
    ]).catch(() => {});
    const buf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    const safeNum = inv.number.replace(/[^\w-]+/g, "-");
    const filename = `facture-${safeNum}.pdf`;
    await fs.mkdir(folder.abs, { recursive: true });
    const absPath = path.join(folder.abs, filename);
    await fs.writeFile(absPath, buf);
    return { path: absPath, filename, bytes: buf.length };
  } finally {
    await browser.close();
  }
}
