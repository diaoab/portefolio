// Utilisable dans le middleware (edge) : pas d'accès à la base ici.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "portfolio_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export type Role = "SUPER_ADMIN" | "USER";
export type SessionPayload = { sub: string; role: Role };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant dans .env");
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { sub: payload.sub as string, role: payload.role as Role };
  } catch {
    return null;
  }
}
