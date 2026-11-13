import { describe, expect, it } from "vitest";
import { istGeladen, KATALOG, KATALOG_ORDNER, KATALOG_QUELLE, katalogEintrag, katalogSvg, ordnerLaden, zeichenLaden } from "./katalog.js";

describe("Katalog", () => {
  it("verzeichnet die ganze Sammlung", () => {
    expect(KATALOG.length).toBeGreaterThan(700);
    expect(KATALOG_ORDNER).toContain("Führungsstellen");
    expect(KATALOG_ORDNER).toContain("Fernmeldewesen");
    expect(KATALOG_QUELLE.version).toMatch(/^v\d/);
    expect(katalogEintrag("Führungsstellen/EAL")?.titel).toBe("Einsatzabschnittsleitung");
    expect(new Set(KATALOG.map((e) => e.schluessel)).size).toBe(KATALOG.length);
  });

  it("lädt Ordner nach und liefert danach synchron", async () => {
    expect(istGeladen("Führungsstellen/UEAL")).toBe(false);
    await ordnerLaden("Führungsstellen");
    const svg = katalogSvg("Führungsstellen/UEAL")!;
    expect(svg).toContain('viewBox="0 0 256 256"');
    expect(svg).toContain(">UEAL</text>");
    expect(svg).not.toContain("<title>");
    expect(svg).not.toContain("base64");
  });

  it("jeder Ordner lässt sich laden und deckt sein Verzeichnis ab", async () => {
    await zeichenLaden(KATALOG.map((e) => e.schluessel));
    for (const e of KATALOG) expect(katalogSvg(e.schluessel), e.schluessel).toMatch(/^<svg /);
  });

  it("unbekannte Ordner und Schlüssel brechen nichts", async () => {
    await ordnerLaden("Gibt_es_nicht");
    expect(katalogSvg("Gibt_es_nicht/X")).toBeUndefined();
    expect(katalogEintrag("x")).toBeUndefined();
  });
});
