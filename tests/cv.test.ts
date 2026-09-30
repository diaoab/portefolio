import { describe, expect, it } from "vitest";
import { cvMissing, fromItems, isCvComplete, parseEntries, splitHeading, toItems } from "@/lib/cv";
import { dictionaries } from "@/lib/i18n";

const text = "2023 – aujourd'hui · Développeuse · Orange\nRefonte de l'espace client.\n\n2021 – 2023 · Front-end · Wave";

describe("parcours du CV", () => {
  it("découpe les entrées séparées par une ligne vide", () => {
    expect(parseEntries(text)).toEqual([
      { heading: "2023 – aujourd'hui · Développeuse · Orange", details: "Refonte de l'espace client." },
      { heading: "2021 – 2023 · Front-end · Wave", details: "" },
    ]);
    expect(parseEntries("  \n\n ")).toEqual([]);
  });

  it("reconnaît période, intitulé et structure", () => {
    expect(splitHeading("2019 – 2021 · Master · UCAD · Dakar")).toEqual({ period: "2019 – 2021", title: "Master", org: "UCAD · Dakar" });
    expect(splitHeading("Consultante · Freelance")).toEqual({ period: "", title: "Consultante", org: "Freelance" });
    expect(splitHeading("Certification AWS")).toEqual({ period: "", title: "Certification AWS", org: "" });
  });

  it("l'éditeur guidé relit et réécrit le même texte", () => {
    expect(fromItems(toItems(text))).toBe(text);
  });

  it("ignore les entrées vides et fusionne les lignes vides d'une description", () => {
    const out = fromItems([
      { period: "2020", role: "Stage", org: "", description: "Ligne 1\n\n\nLigne 2" },
      { period: "", role: "", org: "", description: "" },
    ]);
    expect(out).toBe("2020 · Stage\nLigne 1\nLigne 2");
  });

  it("n'est terminé qu'avec les informations essentielles", () => {
    const base = { fullName: "Awa", headline: "Dev", bio: "Bio", skills: "React", experience: "", education: "" };
    expect(isCvComplete(base)).toBe(false);
    expect(cvMissing(base, dictionaries.fr)).toEqual([dictionaries.fr.cv.needs.path]);
    expect(isCvComplete({ ...base, education: "2020 · Master" })).toBe(true);
    expect(cvMissing({ ...base, education: "2020 · Master" }, dictionaries.fr)).toEqual([]);
  });
});
