/**
 * `@bos/taktische-zeichen/katalog` — der VOLLSTÄNDIGE Katalog der Sammlung
 * (alle Ordner: Führungsstellen, Einrichtungen, Fernmeldewesen, Personen …)
 * für Anwendungen, die Zeichen frei auswählen lassen (komplan.app).
 *
 * Bewusst ein eigener Einstiegspunkt und NICHT aus index.ts exportiert:
 * wer nur `fahrzeugZeichenSvg` braucht (Erfassungsbogen), zieht den Katalog
 * nicht ins Bundle (ADR-003, Aufnahmeregel 5). Die SVG-Quelltexte liegen je
 * Ordner in einem eigenen Modul und werden erst auf Anfrage geladen; danach
 * stehen sie synchron bereit (Zeichnen braucht sie synchron).
 *
 * Schrift: Die Texte in den Zeichen nennen „Roboto Slab"; die Schrift selbst
 * ist nicht enthalten, der Konsument bindet sie ein.
 */

import { KATALOG_VERSION, ORDNER_LADER, VERZEICHNIS } from "./katalog/verzeichnis.js";

export interface KatalogEintrag {
  /** „Ordner/Dateiname", z. B. „Führungsstellen/EAL". */
  schluessel: string;
  /** Ausgeschriebener Name aus dem Original, sonst der Dateiname mit Leerzeichen. */
  titel: string;
  ordner: string;
}

export const KATALOG_QUELLE = {
  url: "https://github.com/jonas-koeritz/Taktische-Zeichen",
  version: KATALOG_VERSION,
  urheber: "Jonas Köritz",
  bearbeitet: "eingebettete Schrift entfernt, viewBox korrigiert, DOCTYPE/Titel/Einrückung entfernt",
} as const;

export const KATALOG: readonly KatalogEintrag[] = VERZEICHNIS.map(([schluessel, titel, ordner]) => ({
  schluessel,
  titel: titel || schluessel.split("/").pop()!.replaceAll("_", " "),
  ordner,
}));

export const KATALOG_ORDNER: readonly string[] = Object.keys(ORDNER_LADER);

const NACH_SCHLUESSEL = new Map(KATALOG.map((e) => [e.schluessel, e]));
const svgCache = new Map<string, string>();
const laufend = new Map<string, Promise<void>>();

export function katalogEintrag(schluessel: string): KatalogEintrag | undefined {
  return NACH_SCHLUESSEL.get(schluessel);
}

/** Lädt die SVG-Quelltexte eines Ordners (einmal; weitere Aufrufe teilen das Promise). */
export function ordnerLaden(ordner: string): Promise<void> {
  let p = laufend.get(ordner);
  if (!p) {
    const lader = ORDNER_LADER[ordner];
    p = lader
      ? lader().then((m) => {
          for (const [k, v] of Object.entries(m.default)) svgCache.set(k, v);
        })
      : Promise.resolve();
    laufend.set(ordner, p);
  }
  return p;
}

/** Lädt die Ordner der genannten Schlüssel. */
export async function zeichenLaden(schluessel: Iterable<string>): Promise<void> {
  const ordner = new Set<string>();
  for (const s of schluessel) ordner.add(s.split("/")[0]!);
  await Promise.all([...ordner].map(ordnerLaden));
}

/** SVG eines Zeichens, falls sein Ordner geladen ist. */
export function katalogSvg(schluessel: string): string | undefined {
  return svgCache.get(schluessel);
}

export function istGeladen(schluessel: string): boolean {
  return svgCache.has(schluessel);
}

/** Für Tests und Werkzeuge: Quelltexte direkt einspielen. */
export function katalogEinspielen(eintraege: Readonly<Record<string, string>>): void {
  for (const [k, v] of Object.entries(eintraege)) svgCache.set(k, v);
}
