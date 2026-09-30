import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyLocalUpload, writeLocalUpload } from "@/lib/uploads";

/** Réception des fichiers en mode développement (en production, le navigateur envoie directement vers R2). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const q = req.nextUrl.searchParams;
  const size = Number(q.get("size"));
  const ok =
    !!(await getCurrentUser()) &&
    verifyLocalUpload(name, q.get("type") ?? "", size, Number(q.get("expires")), q.get("sig") ?? "") &&
    req.headers.get("content-type") === q.get("type");
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const data = Buffer.from(await req.arrayBuffer());
  if (data.length !== size) return NextResponse.json({ error: "size" }, { status: 400 });
  await writeLocalUpload(name, data);
  return new NextResponse(null, { status: 200 });
}
