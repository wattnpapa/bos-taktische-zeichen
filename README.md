# @bos/taktische-zeichen

Taktische Zeichen nach DV 102 als SVG-String — für den Fahrzeugblock im
Papierbogen und als „Avatar" einer Einheit in der Oberfläche.

Dieses Repository ist **kein eigenständiges Produkt**, sondern hängt als
git-Submodul unter `vendor/bos-taktische-zeichen` in zwei Produkten:

- **einheitenerfassungsbogen** — PWA mit Capacitor und Electron, gebaut mit Vite
- **S1-Control v2** — Electron-Anwendung mit npm-Workspaces

Beide binden das Paket über
`"@bos/taktische-zeichen": "file:vendor/bos-taktische-zeichen"` ein.

## Wie gezeichnet wird

Anders als ein Zeichen-Generator, der eine allgemeine Silhouette mit
aufgedrucktem Kurzzeichen erzeugt, liefert dieser Baustein **fertige, benannte
Zeichen**: das echte GKW-, MLW-IV- oder Löschgruppen-Zeichen. Der Kern ist
deshalb eine Zuordnung in drei Stufen:

1. Bekannter Vokabular-Code (heute nur THW) → fest zugeordnetes Zeichen.
2. Namenssuche über Dateinamen und Titel — zuerst im Bereich der Organisation,
   dann in den neutralen Grundzeichen.
3. Kein Treffer → Grundzeichen (Kfz, Anhänger, Boot, Formation nach Größe) in
   der Farbe der Organisation, beschriftet mit dem Kurzzeichen.

## Die Schnittstelle kennt den Bogen nicht

```js
import { fahrzeugZeichenSvg, einheitZeichenSvg } from "@bos/taktische-zeichen";

fahrzeugZeichenSvg({ organisation: "thw", kurz: "GKW", name: "Gerätekraftwagen" });
einheitZeichenSvg({ organisation: "feuerwehr", kurz: "LZ", name: "Löschzug" });
```

Entgegen genommen werden Organisation, Kurzzeichen, Name und — für die fest
zugeordneten THW-Zeichen — der Vokabular-Code. **Keine `Einheit`, kein
`Fahrzeug`, kein `OrganisationsTyp`.** Damit hängt dieser Baustein an nichts,
auch nicht am Bogenmodell; das Auflösen aus einem Erfassungsbogen macht das
Produkt.

Die Organisation ist ein eigener Schlüssel — `"thw"`, `"feuerwehr"`,
`"polizei"`, `"bundeswehr"`, `"hilfsorganisation"`, `"wasserrettung"`,
`"sonstige"`. Das macht sichtbar, was vorher nur in doppelten Tabelleneinträgen
stand: Bundespolizei zeichnet wie Polizei, und die Hilfsorganisationen zeichnen
gemeinsam im Rettungswesen, wo die Zeichen neutral gehalten sind.

## Gerät in fremder Farbe: `farbe`

Eine Einheit führt oft Gerät, das ihr nicht gehört: den Anhänger der Gemeinde,
den Abrollbehälter des Havariekommandos. Dafür nimmt `fahrzeugZeichenSvg`
optional eine abweichende Grundfarbe entgegen:

```js
fahrzeugZeichenSvg({ organisation: "thw", kurz: "Anh SwPu 15000", name: "…", thwCode: 51, farbe: "kommunal" });
```

| `farbe` | Fläche | Herkunft |
| --- | --- | --- |
| `"kommunal"` | `#E26E0E` | das Orange des Bereichs `Kommunal_Fahrzeuge` der Sammlung |
| `"grau"` | `#A6A6A6` | kein Vorbild in der Sammlung; für Behörden, Firmen, Leihgerät |

Rand und Schrift sind in beiden Varianten schwarz, wie bei den
Kommunalfahrzeugen der Sammlung. Führt die Sammlung den Typ in der Farbe selbst
(MTW, Anhänger, Mehrzweckarbeitsboot … in Orange), gilt ihr Zeichen. Sonst wird
das Zeichen der Organisation umgefärbt, der „Anh SwPu" bleibt also als solcher
erkennbar; der Schriftzug „THW" unten rechts entfällt dabei. Ohne `farbe`
ändert sich nichts. Einheitenzeichen kennen die Angabe nicht.

## Herkunft und Lizenz der Zeichen

Die Zeichen in `src/symbole.ts` stammen aus der Sammlung
**[jonas-koeritz/Taktische-Zeichen](https://github.com/jonas-koeritz/Taktische-Zeichen)**
von Jonas Köritz und stehen unter **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**.
Sie sind **bearbeitet**: das Holskript entfernt die eingebettete Schrift (aus
26 kB je Datei werden ~800 B), setzt den Schriftnamen auf einen von pdfmake
registrierten Font, korrigiert `viewbox` zu `viewBox` und entfernt DOCTYPE,
Titel und Einrückung. Urheber, Lizenz und Bearbeitungshinweis stehen im Kopf
der erzeugten Datei.

Das Release-Archiv, aus dem geholt wird, trägt **keine eigene Lizenzdatei** —
es ist ein Bauergebnis desselben Repositorys und damit ebenso lizenziert. Bis
Februar 2021 war die Sammlung anders lizenziert; wer ältere Angaben findet
(etwa „CC0"), sollte sie prüfen.

**Der Code dieses Repositorys steht unter EUPL-1.2, die Zeichen unter CC BY 4.0.**
Wer den Baustein weitergibt, muss die Namensnennung mitführen.

### Aktualisieren

```bash
npm run holen -- v2.1.0
```

Danach den Diff von `src/symbole.ts` ansehen (neue/entfallene Zeichen) und
`npm test` laufen lassen: die Tests prüfen, dass die Zuordnungstabellen noch
auf vorhandene Zeichen zeigen. Ohne sie fiele ein umbenanntes Zeichen lautlos
aufs Grundzeichen zurück. Wöchentlich macht das
`.github/workflows/sammlung-aktualisieren.yml` von selbst.

## Vollständiger Katalog: `@bos/taktische-zeichen/katalog`

Für Anwendungen, die Zeichen frei auswählen lassen (komplan.app), gibt es
einen eigenen Einstiegspunkt mit **allen** Ordnern der Sammlung
(Führungsstellen, Einrichtungen, Fernmeldewesen, Personen, Gefahren …):

```js
import { KATALOG, ordnerLaden, katalogSvg } from "@bos/taktische-zeichen/katalog";

await ordnerLaden("Führungsstellen");
katalogSvg("Führungsstellen/EAL"); // SVG-Quelltext, 256 × 256
```

- `KATALOG` verzeichnet Schlüssel, Titel und Ordner aller Zeichen, ohne die
  SVG-Quelltexte zu laden (für Suche und Listen).
- Die Quelltexte liegen je Ordner in `src/katalog/ordner/*.ts` und werden per
  `import()` nachgeladen; Bundler machen daraus eigene Teile. Danach liefert
  `katalogSvg` synchron.
- Der Katalog wird **nicht** aus `index.ts` exportiert. Wer nur
  `fahrzeugZeichenSvg` braucht, bekommt ihn nicht ins Bundle
  (Aufnahmeregel 5).
- Anders als `src/symbole.ts` bleibt der Schriftname „Roboto Slab" stehen;
  die Schrift bindet der Konsument ein.

Erzeugt von `npm run katalog:holen` aus derselben festgeschriebenen Version
wie `npm run holen`; der Wochen-Workflow zieht beides gemeinsam nach.

## Aufnahmeregeln (ADR-003)

1. Aufnahme nur, wenn beide Produkte den Baustein aufrufen.
2. Keine `node:`-, DOM- oder React-Importe; geprüft per ESLint und durch Testlauf unter `node` und `jsdom`.
3. Keine Rückimporte aus `@s1/*` oder aus der Erfassungsbogen-App.
4. Änderungen additiv; Schema-Abwärtskompatibilität bleibt Pflicht.
5. Bundle-Budget im CI von erfassungsbogen.app; der Kern darf die PWA nicht schwerer machen.
6. Gepinnte Submodul-Commits; kein automatisches Folgen von `main`.

Regel 2 gilt für `src/`. Das Holskript unter `scripts/` ist ein Werkzeug: es
lädt ein Archiv und schreibt eine Datei, benutzt dafür `node:`-Module und ist
vom Lint ausgenommen.

## Lokal bauen und prüfen

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm test
```

Das Paket trägt bewusst **kein `prepare`-Skript**: npm ordnet die Läufe von
`file:`-Abhängigkeiten nicht nach der Peer-Beziehung, und führt Install-Skripte
inzwischen ohnehin nicht mehr ungefragt aus. Wer `dist/` braucht, baut
ausdrücklich und in der Reihenfolge eeb-format → vokabulare →
taktische-zeichen → meldekopf. Ausführlich im README von eeb-format.

## Lizenz

Code: EUPL-1.2 · Zeichen in `src/symbole.ts` und `src/katalog/`: © Jonas Köritz (laut Projekt: fertige Zeichen CC0 1.0, Quellcode CC BY 4.0; die Namensnennung wird in jedem Fall mitgeführt)
