import type { CalendarSlot } from "@/lib/types";

// Calendrier démo — basé sur le brief "Lancement Davide" semaines 17-20 (mai 2026).
// Chaque slot est consultatif — MVP = lecture seule.
export const CALENDAR_WEEK: CalendarSlot[] = [
  { day: "Lun. 20 avr.", channel: "LinkedIn", time: "07:45", title: "Le SDR qui ne prend jamais de congés (Angle A)", author: "Melyssa",      status: "programmé", deliverableRef: "2026-04-17-Nonvi-Efa-linkedin-long-davide-sdr-sans-conges.md" },
  { day: "Lun. 20 avr.", channel: "Instagram", time: "18:30", title: "Reel : 'Davide travaille cette nuit'",           author: "Page Nonvi-Efa", status: "brouillon" },
  { day: "Mar. 21 avr.", channel: "LinkedIn", time: "08:15", title: "Carrousel ChatGPT vs Davide (Angle B)",            author: "Octave",      status: "programmé", deliverableRef: "2026-04-17-Nonvi-Efa-linkedin-carrousel-chatgpt-vs-davide.md" },
  { day: "Mer. 22 avr.", channel: "YouTube",   time: "10:00", title: "Démo live : Davide en prod (Angle C)",            author: "Melyssa",      status: "programmé", deliverableRef: "2026-04-17-Nonvi-Efa-yt-long-demo-davide.md" },
  { day: "Mer. 22 avr.", channel: "Email",     time: "14:00", title: "Séquence nurturing 1/3 — inscrits Masterclass",   author: "Octave",      status: "brouillon" },
  { day: "Jeu. 23 avr.", channel: "LinkedIn", time: "07:30", title: "Thread : 3 garde-fous pour éviter l'hallucination", author: "Melyssa",      status: "brouillon" },
  { day: "Ven. 24 avr.", channel: "Instagram", time: "19:00", title: "Reel short #1 — dérivé de la vidéo Démo Davide",  author: "Page Nonvi-Efa", status: "brouillon" },
  { day: "Sam. 25 avr.", channel: "LinkedIn", time: "11:00", title: "Retour sur la Masterclass (live recap)",            author: "Melyssa",      status: "brouillon" },
  { day: "Dim. 26 avr.", channel: "YouTube",   time: "16:00", title: "Short #2 — 'Davide passe la main à un humain'",   author: "Melyssa",      status: "brouillon" },
];

export const CHANNELS: CalendarSlot["channel"][] = ["LinkedIn", "Instagram", "YouTube", "Email"];
export const DAYS = [
  "Lun. 20 avr.",
  "Mar. 21 avr.",
  "Mer. 22 avr.",
  "Jeu. 23 avr.",
  "Ven. 24 avr.",
  "Sam. 25 avr.",
  "Dim. 26 avr.",
];
