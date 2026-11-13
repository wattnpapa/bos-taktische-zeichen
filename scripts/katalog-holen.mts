/**
 * Holt den VOLLSTÄNDIGEN Katalog aus dem Release-Archiv von
 * github.com/jonas-koeritz/Taktische-Zeichen nach src/katalog/:
 *
 *  - src/katalog/ordner/<ordner>.ts — je Ordner der Sammlung ein Modul mit
 *    den SVG-Quelltexten (Default-Export), einzeln nachladbar;
 *  - src/katalog/verzeichnis.ts — Schlüssel, Titel und Ordner aller Zeichen
 *    plus je Ordner ein `import()` auf sein Modul.
 *
 * Anders als src/symbole.ts (holen.mts, nur die Ordner des Erfassungsbogens,
 * Schrift auf „Roboto" für pdfmake umbenannt) bleibt hier der Schriftname
 * „Roboto Slab" stehen; der Konsument bindet die Schrift selbst ein.
 * Aufbereitung sonst wie in holen.mts: eingebettete Schrift raus, `viewbox`
 * → `viewBox`, DOCTYPE/Titel/Einrückung raus. Umlaute in Ordnernamen, die
 * das Archiv als „#U00fc" schreibt, werden zurückübersetzt.
 *
 * Die Version kommt aus holen.mts (eine Stelle, die der Wochen-Workflow
 * mitzieht), übersteuerbar per Argument:
 *
 *     npm run katalog:holen
 *     npm run katalog:holen -- v2.1.0
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HOLEN = readFileSync(fileURLToPath(new URL("./holen.mts", import.meta.url)), "utf8");
const FEST = HOLEN.match(/process\.argv\[2\] \?\? "([^"]+)"/)?.[1] ?? "v2.0.0";
const VERSION = process.argv[2] ?? FEST;
const RELEASE = `https://github.com/jonas-koeritz/Taktische-Zeichen/releases/download/${VERSION}/release.zip`;
const ZIEL = fileURLToPath(new URL("../src/katalog/", import.meta.url));

const SCHLUESSEL_KORREKTUR: [string, string][] = [["FGr_Wassserschaden-Pumpen", "FGr_Wasserschaden-Pumpen"]];

const entschluesseln = (name: string) => name.replace(/#U([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));

/** Dateiname des Ordnermoduls: nur ASCII, damit kein Werkzeug stolpert. */
const modulName = (ordner: string) =>
  ordner.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function aufbereiten(roh: string): { svg: string; titel: string } {
  const titel = roh.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
  let svg = roh
    .replace(/^<!DOCTYPE[^>]*>\s*/, "")
    .replace(/\s*<style type="text\/css">[\s\S]*?<\/style>/g, "")
    .replace(/\s*<title>[\s\S]*?<\/title>/g, "")
    .replace(/<defs>\s*<\/defs>/g, "")
    .replace(/\bviewbox=/g, "viewBox=");
  svg = svg.replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
  return { svg, titel };
}

const KOPF = (zusatz: string) => `// GENERIERT von scripts/katalog-holen.mts — nicht von Hand ändern.
// Quelle: github.com/jonas-koeritz/Taktische-Zeichen, Release ${VERSION}.
// © Jonas Köritz. Lizenz laut Projekt: fertige Zeichen CC0 1.0, Quellcode CC BY 4.0.
// Bearbeitet: eingebettete Schrift entfernt, viewBox korrigiert, DOCTYPE/Titel/Einrückung entfernt.
${zusatz}`;

const tmp = mkdtempSync(join(tmpdir(), "tz-katalog-"));
try {
  console.log(`Lade ${RELEASE} …`);
  execFileSync("curl", ["-sSfL", "-o", join(tmp, "release.zip"), RELEASE], { stdio: "inherit" });
  execFileSync("unzip", ["-q", "-o", join(tmp, "release.zip"), "svg/*", "-d", tmp]);
  rmSync(join(ZIEL, "ordner"), { recursive: true, force: true });
  mkdirSync(join(ZIEL, "ordner"), { recursive: true });

  const eintraege: Array<[string, string, string]> = [];
  const module: Array<[string, string]> = [];
  for (const roh of readdirSync(join(tmp, "svg")).sort()) {
    const ordner = entschluesseln(roh);
    const dateien = readdirSync(join(tmp, "svg", roh)).filter((d) => d.endsWith(".svg")).sort();
    if (!dateien.length) continue;
    const inhalt: Array<[string, string]> = [];
    for (const datei of dateien) {
      let schluessel = `${ordner}/${entschluesseln(datei.replace(/\.svg$/, ""))}`;
      for (const [falsch, richtig] of SCHLUESSEL_KORREKTUR) schluessel = schluessel.replace(falsch, richtig);
      const { svg, titel } = aufbereiten(readFileSync(join(tmp, "svg", roh, datei), "utf8"));
      inhalt.push([schluessel, svg]);
      eintraege.push([schluessel, titel, ordner]);
    }
    const name = modulName(ordner);
    module.push([ordner, name]);
    writeFileSync(
      join(ZIEL, "ordner", `${name}.ts`),
      `${KOPF(`// Ordner „${ordner}", ${inhalt.length} Zeichen.\n`)}
const zeichen: Record<string, string> = {
${inhalt.map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`).join("\n")}
};
export default zeichen;
`,
    );
    console.log(`  ${ordner}: ${dateien.length}`);
  }
  eintraege.sort((a, b) => a[0].localeCompare(b[0], "de"));
  writeFileSync(
    join(ZIEL, "verzeichnis.ts"),
    `${KOPF(`// ${eintraege.length} Zeichen in ${module.length} Ordnern.\n`)}
/** Release der Sammlung, aus dem der Katalog stammt. */
export const KATALOG_VERSION = ${JSON.stringify(VERSION)};

/** [Schlüssel „Ordner/Name", Titel aus dem Original, Ordner] je Zeichen. */
export const VERZEICHNIS: ReadonlyArray<readonly [string, string, string]> = [
${eintraege.map((e) => `  ${JSON.stringify(e)},`).join("\n")}
];

/** Je Ordner ein Nachlader; Bundler machen daraus eigene Teile. */
export const ORDNER_LADER: Readonly<Record<string, () => Promise<{ default: Record<string, string> }>>> = {
${module.map(([o, n]) => `  ${JSON.stringify(o)}: () => import("./ordner/${n}.js"),`).join("\n")}
};
`,
  );
  console.log(`\n${eintraege.length} Zeichen in ${module.length} Ordnern → ${ZIEL}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
