import { describe, it, expect } from "vitest";
import {
  THW_EINHEIT_ZEICHEN,
  THW_FAHRZEUG_ZEICHEN,
  ZEICHENFARBEN,
  einheitZeichenSvg,
  fahrzeugZeichenSvg,
  grundzeichenFuer,
  svgDataUrl,
  type Zeichenorganisation,
} from "./zeichen.js";
import { TZ_SYMBOLE } from "./symbole.js";

const ORGANISATIONEN: Zeichenorganisation[] = [
  "thw",
  "feuerwehr",
  "polizei",
  "bundeswehr",
  "hilfsorganisation",
  "wasserrettung",
  "sonstige",
];

describe("grundzeichenFuer()", () => {
  it("erkennt Anhänger (auch vor einem enthaltenen WLF-Treffer)", () => {
    expect(grundzeichenFuer("Anh Plattform")).toBe("anhaenger");
    expect(grundzeichenFuer("Auflieger Sattelzug")).toBe("anhaenger");
    expect(grundzeichenFuer("Anh WLF-Zubehör")).toBe("anhaenger");
  });

  it("erkennt Wasserfahrzeuge", () => {
    expect(grundzeichenFuer("MzAB Mehrzweckarbeitsboot")).toBe("wasserfahrzeug");
  });

  it("erkennt Wechsellader", () => {
    expect(grundzeichenFuer("LKW WLF Wechsellader")).toBe("wechsellader");
  });

  it("erkennt geländegängige Kraftfahrzeuge am Kuerzel gl", () => {
    expect(grundzeichenFuer("LKW LK gl")).toBe("kraftfahrzeug-gelaendegaengig");
    expect(grundzeichenFuer("MTW gl")).toBe("kraftfahrzeug-gelaendegaengig");
  });

  it("nutzt sonst das landgebundene Kraftfahrzeug", () => {
    expect(grundzeichenFuer("FmKW")).toBe("kraftfahrzeug");
    expect(grundzeichenFuer("")).toBe("kraftfahrzeug");
  });
});

describe("Zeichensammlung", () => {
  // Diese Gruppe ist das Sicherheitsnetz der Aktualisierung: benennt die
  // Sammlung ein Zeichen um oder entfernt es, muss der Lauf hier scheitern
  // statt still aufs Grundzeichen zurückzufallen.
  //
  // Die Gegenrichtung — hat jeder Vokabular-Code eine Zuordnung? — steht
  // bewusst NICHT hier: sie vergleicht diesen Baustein mit @bos/vokabulare und
  // gehört deshalb in das Produkt, das beide zusammenführt.

  it("hat für jeden fest zugeordneten THW-Fahrzeugtyp ein Zeichen", () => {
    const fehlend = Object.entries(THW_FAHRZEUG_ZEICHEN)
      .filter(([, datei]) => !TZ_SYMBOLE[`THW_Fahrzeuge/${datei}`])
      .map(([code, datei]) => `${code} → ${datei}`);
    expect(fehlend).toEqual([]);
  });

  it("hat für jeden fest zugeordneten THW-Einheitstyp ein Zeichen", () => {
    const fehlend = Object.entries(THW_EINHEIT_ZEICHEN)
      .filter(([, datei]) => !TZ_SYMBOLE[`THW_Einheiten/${datei}`])
      .map(([code, datei]) => `${code} → ${datei}`);
    expect(fehlend).toEqual([]);
  });

  it("findet für jede Organisation ein Rückfallzeichen", () => {
    // Prüft die Grundzeichen-Namen gegen die Bereiche jeder Organisation —
    // heißt „Kraftfahrzeug" upstream mal anders, fällt es hier auf.
    for (const organisation of ORGANISATIONEN) {
      for (const typ of ["Rätselfahrzeug", "Anhänger X", "Boot X", "WLF X", "Kfz gl X"]) {
        expect(
          fahrzeugZeichenSvg({ organisation, kurz: typ, name: typ }),
          `${organisation}/${typ}`,
        ).toContain("<svg");
      }
      for (const typ of ["Etwas", "Sonderzug", "Sonderstaffel", "Sondertrupp"]) {
        expect(
          einheitZeichenSvg({ organisation, kurz: typ, name: typ }),
          `${organisation}/${typ}`,
        ).toContain("<svg");
      }
    }
  });

  it("bringt keine eingebettete Schrift mit (sonst 26 kB je Zeichen)", () => {
    const gross = Object.entries(TZ_SYMBOLE).filter(([, svg]) => svg.length > 4000);
    expect(gross).toEqual([]);
    expect(Object.values(TZ_SYMBOLE).some((s) => s.includes("@font-face"))).toBe(false);
  });

  it("nennt nur von pdfmake registrierte Schriften", () => {
    expect(Object.values(TZ_SYMBOLE).some((s) => s.includes("Roboto Slab"))).toBe(false);
  });

  it("schreibt viewBox groß (in der data:-URL wird das SVG als XML gelesen)", () => {
    expect(Object.values(TZ_SYMBOLE).every((s) => !s.includes("viewbox="))).toBe(true);
  });
});

describe("fahrzeugZeichenSvg()", () => {
  const svg = (kurz: string, name = kurz, organisation: Zeichenorganisation = "thw", thwCode?: number) =>
    fahrzeugZeichenSvg({ organisation, kurz, name, thwCode });

  it("nutzt für einen bekannten THW-Code das benannte Zeichen der Sammlung", () => {
    const s = svg("FmKW", "Fernmeldekraftwagen", "thw", 1);
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/FmKW"]);
    expect(s).toContain("#003399"); // THW-Blau
    expect(s).toContain("FmKW");
  });

  it("zeichnet den Anhänger 2t als solchen, nicht als Silhouette mit Aufdruck", () => {
    expect(svg("Anh 2t", "Anhänger 2t", "thw", 40)).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Anhänger_2t"]);
  });

  it("beschriftet Typen ohne eigenes Zeichen statt sie namenlos zu lassen", () => {
    // Anh BDF hat kein eigenes Zeichen — dann lieber der Anhänger mit „BDF"
    // als ein nackter Anhänger, der von jedem anderen ununterscheidbar ist.
    expect(svg("Anh BDF", "Anhänger BDF", "thw", 54)).toContain(">BDF</text>");
  });

  it("findet ein Zeichen auch über den Namen (Schreibweise egal)", () => {
    expect(svg("MzKW")).toBe(TZ_SYMBOLE["THW_Fahrzeuge/MzKW"]);
    expect(svg("mlw ii")).toBe(TZ_SYMBOLE["THW_Fahrzeuge/MLW_II"]);
    expect(svg("LF 16-TS", "LF 16-TS", "feuerwehr")).toBe(TZ_SYMBOLE["Feuerwehr_Fahrzeuge/LF_16-TS"]);
  });

  it("fällt ohne Treffer auf das Grundzeichen der Organisation zurück", () => {
    expect(svg("Kuriosum")).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Kraftfahrzeug"]);
  });

  it("beschriftet das Rückfallzeichen mit dem Kurzzeichen", () => {
    expect(svg("XY-42")).toContain(">XY-42</text>");
  });

  it("lässt zu lange Kurzzeichen unbeschriftet (nur die Silhouette bleibt)", () => {
    // Das THW-Grundzeichen trägt ein „THW" in der Ecke — die mittige
    // Beschriftung (48 px) darf trotzdem nicht dazukommen.
    const s = svg("Rätselfahrzeug");
    expect(s).toBe(TZ_SYMBOLE["THW_Fahrzeuge/Kraftfahrzeug"]);
    expect(s).not.toContain("font-size: 48px");
  });

  it("maskiert Sonderzeichen aus dem Freitext", () => {
    expect(svg("A&B")).toContain(">A&amp;B</text>");
  });

  it("färbt das Zeichen je Organisation (Feuerwehr ungleich THW-Blau)", () => {
    const fw = svg("Rätselfahrzeug", "Rätselfahrzeug", "feuerwehr");
    expect(fw).toContain("#FF0000");
    expect(fw).not.toContain("#003399");
  });

  it("rendert auch ohne bekannte Organisation ein neutrales Zeichen", () => {
    const s = svg("MZF", "MZF", "sonstige");
    expect(s).toContain("<svg");
    expect(s).toContain('fill="#FFFFFF"');
    expect(s).toContain(">MZF</text>");
  });

  it("greift die feste THW-Zuordnung nur bei der THW-Organisation", () => {
    // Derselbe Code bedeutet bei einer anderen Organisation nichts — dort
    // entscheiden Kurzzeichen und Name.
    const s = fahrzeugZeichenSvg({ organisation: "feuerwehr", kurz: "Kuriosum", name: "Kuriosum", thwCode: 1 });
    expect(s).not.toBe(TZ_SYMBOLE["THW_Fahrzeuge/FmKW"]);
  });
});

describe("einheitZeichenSvg()", () => {
  it("nutzt für einen bekannten THW-Code das Fachgruppen-Zeichen", () => {
    const s = einheitZeichenSvg({ organisation: "thw", kurz: "FGr R (A)", name: "Fachgruppe Räumen (A)", thwCode: 6 });
    expect(s).toBe(TZ_SYMBOLE["THW_Einheiten/FGr_Räumen_A"]);
  });

  it("findet Einheiten anderer Organisationen über den Namen", () => {
    const s = einheitZeichenSvg({ organisation: "feuerwehr", kurz: "Löschzug", name: "Löschzug" });
    expect(s).toBe(TZ_SYMBOLE["Feuerwehr_Einheiten/Löschzug"]);
  });

  it("wählt ohne Treffer die Formation passender Größe und beschriftet sie", () => {
    const s = einheitZeichenSvg({ organisation: "thw", kurz: "Sonderzug", name: "Sonderzug" });
    expect(s).toContain(">Sonderzug</text>");
    // Der Zug trägt drei Punkte über dem Rechteck.
    expect(s.match(/<ellipse/g)?.length).toBe(3);
  });

  it("nimmt für Unbekanntes ohne Größenwort die Gruppe", () => {
    const s = einheitZeichenSvg({ organisation: "thw", kurz: "Etwas", name: "Etwas" });
    expect(s.match(/<ellipse/g)?.length).toBe(2);
    expect(s).toContain("#003399");
  });
});

describe("svgDataUrl()", () => {
  it("verpackt das SVG als data:-URL", () => {
    expect(svgDataUrl("<svg/>")).toBe("data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E");
  });
});

describe("fahrzeugZeichenSvg() mit abweichender Grundfarbe", () => {
  const ORANGE = ZEICHENFARBEN.kommunal;
  const GRAU = ZEICHENFARBEN.grau;

  it("ohne Angabe bleibt die Farbe der Organisation", () => {
    const svg = fahrzeugZeichenSvg({ organisation: "thw", kurz: "Anh 2t", name: "Anhänger 2 t", thwCode: 40 });
    expect(svg).toContain('fill="#003399"');
    expect(svg).not.toContain(ORANGE);
  });

  it("nimmt das Kommunalzeichen der Sammlung, wenn sie den Typ führt", () => {
    const svg = fahrzeugZeichenSvg({ organisation: "thw", kurz: "MTW", name: "Mannschaftstransportwagen", thwCode: 24, farbe: "kommunal" });
    expect(svg).toBe(TZ_SYMBOLE["Kommunal_Fahrzeuge/MTW"]);
    expect(fahrzeugZeichenSvg({ organisation: "sonstige", kurz: "Anhänger", name: "Anhänger", farbe: "kommunal" })).toBe(
      TZ_SYMBOLE["Kommunal_Fahrzeuge/Anhänger"],
    );
  });

  it("färbt ein Organisationszeichen um: Fläche farbig, Rand und Schrift schwarz, ohne THW-Schriftzug", () => {
    for (const [farbe, hex] of [["kommunal", ORANGE], ["grau", GRAU]] as const) {
      const svg = fahrzeugZeichenSvg({ organisation: "thw", kurz: "Anh NEA 200 kVA", name: "Anhänger NEA 200 kVA", thwCode: 48, farbe });
      expect(svg).toContain(`fill="${hex}"`);
      expect(svg).not.toContain("#003399");
      expect(svg).not.toMatch(/#FFFFFF/i);
      expect(svg).not.toContain(">THW<");
      expect(svg).toContain(">NEA<"); // der Typ bleibt erkennbar
    }
  });

  it("färbt auch das beschriftete Rückfallzeichen jeder Organisation", () => {
    for (const organisation of ORGANISATIONEN) {
      const svg = fahrzeugZeichenSvg({ organisation, kurz: "Anh X1", name: "Sonderanhänger", farbe: "grau" });
      expect(svg).toContain(`fill="${GRAU}"`);
      expect(svg).toContain('fill="#000000" x="128" y="145">X1</text>');
      expect(svg).not.toMatch(/stroke="#FFFFFF"/i);
    }
  });

  it("Grau hat keinen eigenen Bereich und wird immer umgefärbt", () => {
    const svg = fahrzeugZeichenSvg({ organisation: "feuerwehr", kurz: "MTW", name: "Mannschaftstransportwagen", farbe: "grau" });
    expect(svg).toContain(`fill="${GRAU}"`);
    expect(svg).not.toContain("#FF0000");
  });

  it("Einheitenzeichen kennen keine abweichende Farbe", () => {
    const mit = einheitZeichenSvg({ organisation: "thw", kurz: "B", name: "Bergungsgruppe", thwCode: 4, farbe: "kommunal" });
    expect(mit).toBe(einheitZeichenSvg({ organisation: "thw", kurz: "B", name: "Bergungsgruppe", thwCode: 4 }));
  });
});
