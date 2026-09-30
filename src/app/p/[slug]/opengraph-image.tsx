import { readFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getLocale } from "@/lib/i18n-server";
import { localizeProfile } from "@/lib/localize";
import { getPublicProfile } from "@/lib/public";
import { getSettings } from "@/lib/settings";
import { isHex, readableOn } from "@/lib/theme";
import { UPLOAD_DIR } from "@/lib/uploads";
import { initials, splitList } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portfolio";

/** Image de partage (WhatsApp, LinkedIn, X…) générée pour chaque portfolio. */
export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const raw = await getPublicProfile((await params).slug);
  const { siteName } = await getSettings();
  if (!raw) return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "#09090b" }} />, size);
  const p = localizeProfile(raw, await getLocale());
  const accent = isHex(p.accent) ? p.accent : "#7c5cff";

  let photo: string | null = null;
  if (p.avatarUrl?.startsWith("/api/files/")) {
    const buf = await readFile(path.join(UPLOAD_DIR, path.basename(p.avatarUrl))).catch(() => null);
    if (buf) photo = `data:image/png;base64,${(await sharp(buf).resize(320, 320, { fit: "cover" }).png().toBuffer()).toString("base64")}`;
  }

  const font = (pkg: string, file: string) => readFile(path.join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));
  const [grotesk, inter] = await Promise.all([
    font("space-grotesk", "space-grotesk-latin-700-normal.woff"),
    font("inter", "inter-latin-500-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0b0b10", color: "#f4f4f5", padding: 72, position: "relative", fontFamily: "Inter" }}>
        <div style={{ position: "absolute", top: -200, right: -150, width: 700, height: 700, borderRadius: 9999, background: accent, opacity: 0.28, filter: "blur(120px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 56, width: "100%" }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={260} height={260} style={{ borderRadius: 9999, border: `8px solid ${accent}` }} alt="" />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 260, height: 260, borderRadius: 9999, background: accent, color: readableOn(accent), fontSize: 110, fontWeight: 700 }}>
              {initials(p.fullName)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontFamily: "Grotesk", fontSize: 78, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>{p.fullName}</div>
            {p.headline && <div style={{ marginTop: 18, fontSize: 36, color: accent }}>{p.headline}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 }}>
              {splitList(p.skills).slice(0, 5).map((s) => (
                <div key={s} style={{ display: "flex", padding: "8px 20px", borderRadius: 999, border: "2px solid #2a2a35", fontSize: 24, color: "#d4d4d8" }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", left: 72, bottom: 44, fontSize: 24, color: "#71717a" }}>{siteName}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Grotesk", data: grotesk, weight: 700 },
        { name: "Inter", data: inter, weight: 500 },
      ],
    },
  );
}
