import { describe, expect, it } from "vitest";
import { contrastRatio, readableOn } from "@/lib/theme";
import { normalizeUrl, slugify, splitList, toEmbedUrl } from "@/lib/utils";

describe("utilitaires", () => {
  it("slugify retire accents et caractères spéciaux", () => {
    expect(slugify("  Awa Diallo — Développeuse ! ")).toBe("awa-diallo-developpeuse");
  });

  it("splitList nettoie les listes séparées par des virgules", () => {
    expect(splitList(" React, , Figma ,Node ")).toEqual(["React", "Figma", "Node"]);
  });

  it("normalizeUrl ajoute https://", () => {
    expect(normalizeUrl("monsite.com")).toBe("https://monsite.com");
    expect(normalizeUrl("http://a.b")).toBe("http://a.b");
  });

  it("convertit les liens YouTube / Vimeo en lecteurs intégrables", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(toEmbedUrl("https://youtu.be/abc123")).toBe("https://www.youtube.com/embed/abc123");
    expect(toEmbedUrl("https://vimeo.com/42")).toBe("https://player.vimeo.com/video/42");
    expect(toEmbedUrl("https://example.com")).toBeNull();
  });

  it("choisit un texte lisible sur une couleur", () => {
    expect(readableOn("#000000")).toBe("#ffffff");
    expect(readableOn("#ffffff")).toBe("#111111");
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
  });
});
