import type { Metadata } from "next";
import { Inter, Instrument_Serif, Sacramento, Archivo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

// Police display grasse (landing "Bronx" — marquee géant, titres, nav pill).
// Variable font : toutes les graisses 100→900 disponibles.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// Police script/cursive type "Althea" — pour le logo et les accents calligraphiques.
const sacramento = Sacramento({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nonvi-Efa · Une équipe d'employés IA",
  description: "Mon équipe d'employés IA, sous la main — Nonvi-Efa Agency.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${instrumentSerif.variable} ${sacramento.variable} ${archivo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
