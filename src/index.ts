/**
 * `@bos/taktische-zeichen` — taktische Zeichen nach DV 102 als SVG-String.
 *
 * Zwei Teile: die eingebackene Zeichensammlung (`symbole`) und die Zuordnung
 * darauf (`zeichen`) — Vokabular-Code, Namenssuche, Grundzeichen als Rückfall.
 *
 * Hängt von nichts ab, auch nicht vom Bogenmodell: die Schnittstelle nimmt
 * Organisation, Kurzzeichen und Name entgegen, nicht eine `Einheit`. Wer aus
 * einem Erfassungsbogen zeichnen will, löst das im Produkt auf.
 */

export * from "./zeichen.js";
export { TZ_SYMBOLE, TZ_TITEL } from "./symbole.js";
