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

## Lizenz

Code: EUPL-1.2 · Zeichen in `src/symbole.ts`: CC BY 4.0, © Jonas Köritz
