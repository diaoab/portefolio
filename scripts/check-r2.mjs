// Vérifie la configuration Cloudflare R2 de .env : envoi, lecture publique, CORS, suppression.
// Usage : npm run check:r2
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, APP_URL } = process.env;
const missing = Object.entries({ R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL }).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.log(`✗ Variables manquantes dans .env : ${missing.join(", ")}\n  → lancez : npm run configure r2`);
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});
const key = `check-${Date.now()}.txt`;
const publicBase = R2_PUBLIC_URL.replace(/\/$/, "");
let ok = true;
const step = (good, label, hint = "") => {
  console.log(`${good ? "✓" : "✗"} ${label}${!good && hint ? `\n  → ${hint}` : ""}`);
  if (!good) ok = false;
  return good;
};

try {
  await client.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: "folio", ContentType: "text/plain" }));
  step(true, "Envoi d'un fichier test dans le bucket");
} catch (e) {
  step(false, `Envoi impossible : ${e.name}`, e.name === "NoSuchBucket" ? `le bucket « ${R2_BUCKET} » n'existe pas (vérifiez R2_BUCKET)` : "vérifiez R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY et la permission « Object Read & Write » du token");
  process.exit(1);
}

const res = await fetch(`${publicBase}/${key}`).catch(() => null);
step(res?.ok && (await res.text()) === "folio", "Lecture par l'URL publique", "activez « Public Development URL » (ou un Custom Domain) dans Settings du bucket, et vérifiez R2_PUBLIC_URL");

for (const origin of ["http://localhost:3000", APP_URL].filter(Boolean)) {
  // Pré-vérification CORS faite par le navigateur avant chaque envoi
  const pre = await fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`, {
    method: "OPTIONS",
    headers: { Origin: origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" },
  }).catch(() => null);
  const allowed = pre?.headers.get("access-control-allow-origin");
  step(allowed === origin || allowed === "*", `CORS autorise les envois depuis ${origin}`, `ajoutez "${origin}" dans AllowedOrigins (Settings du bucket → CORS Policy)`);
}

await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })).catch(() => {});
console.log(ok ? "\n✓ R2 est prêt." : "\nCorrigez les points ✗ puis relancez : npm run check:r2");
process.exit(ok ? 0 : 1);
