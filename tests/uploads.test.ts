import { afterEach, describe, expect, it, vi } from "vitest";
import { dictionaries } from "@/lib/i18n";

const ID = "123e4567-e89b-42d3-a456-426614174000";

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("@/lib/uploads");
}

afterEach(() => vi.unstubAllEnvs());

describe("stockage local (développement)", () => {
  it("refuse les formats et tailles non autorisés", async () => {
    const { checkUpload } = await load({ AUTH_SECRET: "s" });
    const t = dictionaries.fr;
    expect(() => checkUpload({ name: "a.pdf", type: "application/pdf", size: 10 }, ["image"], t)).toThrow();
    expect(() => checkUpload({ name: "v.mp4", type: "video/mp4", size: 10 }, ["image"], t)).toThrow();
    expect(() => checkUpload({ name: "a.jpg", type: "image/jpeg", size: 9 * 1024 * 1024 }, ["image"], t)).toThrow();
    expect(checkUpload({ name: "v.mp4", type: "video/mp4", size: 50 * 1024 * 1024 }, ["image", "video"], t)).toEqual({ kind: "video", ext: "mp4" });
  });

  it("signe les envois et rejette toute modification", async () => {
    const { createUpload, verifyLocalUpload } = await load({ AUTH_SECRET: "s" });
    const { uploadUrl, url } = await createUpload({ name: "a.png", type: "image/png", size: 1234 }, ["image"], dictionaries.fr);
    expect(url).toMatch(/^\/api\/files\/[0-9a-f-]{36}\.png$/);
    const u = new URL(uploadUrl, "http://x");
    const key = u.pathname.split("/").pop()!;
    const [type, size, expires, sig] = ["type", "size", "expires", "sig"].map((k) => u.searchParams.get(k)!);
    expect(verifyLocalUpload(key, type, Number(size), Number(expires), sig)).toBe(true);
    expect(verifyLocalUpload(key, type, Number(size) + 1, Number(expires), sig)).toBe(false);
    expect(verifyLocalUpload(key, "image/jpeg", Number(size), Number(expires), sig)).toBe(false);
    expect(verifyLocalUpload(`../${key}`, type, Number(size), Number(expires), sig)).toBe(false);
  });

  it("ne reconnaît que ses propres fichiers", async () => {
    const { keyOf, kindOf } = await load({ AUTH_SECRET: "s" });
    expect(keyOf(`/api/files/${ID}.jpg`)).toBe(`${ID}.jpg`);
    expect(keyOf("/api/files/../../.env")).toBeNull();
    expect(keyOf(`https://evil.com/${ID}.jpg`)).toBeNull();
    expect(kindOf(`/api/files/${ID}.mov`)).toBe("video");
  });
});

describe("Cloudflare R2 (production)", () => {
  const env = {
    AUTH_SECRET: "s",
    R2_BUCKET: "folio",
    R2_ACCOUNT_ID: "acc123",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_PUBLIC_URL: "https://media.mon-domaine.com/",
  };

  it("génère une URL d'envoi signée vers R2 et l'URL publique", async () => {
    const { createUpload } = await load(env);
    const { uploadUrl, url } = await createUpload({ name: "v.mp4", type: "video/mp4", size: 5000 }, ["video"], dictionaries.fr);
    expect(url).toMatch(/^https:\/\/media\.mon-domaine\.com\/[0-9a-f-]{36}\.mp4$/);
    const u = new URL(uploadUrl);
    expect(u.host).toBe("folio.acc123.r2.cloudflarestorage.com");
    expect(u.searchParams.get("X-Amz-Signature")).toBeTruthy();
    // Type et taille sont signés : R2 refusera un autre fichier
    expect(u.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(u.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
  });

  it("reconnaît les URLs publiques R2 et les anciennes URLs locales", async () => {
    const { keyOf } = await load(env);
    expect(keyOf(`https://media.mon-domaine.com/${ID}.png`)).toBe(`${ID}.png`);
    expect(keyOf(`/api/files/${ID}.png`)).toBe(`${ID}.png`);
    expect(keyOf(`https://media.mon-domaine.com.evil.com/${ID}.png`)).toBeNull();
  });
});
