import "server-only";
import { db } from "./db";
import { deleteUpload } from "./uploads";

/** Supprime un compte et tous ses fichiers (photo, couverture, médias des réalisations). */
export async function deleteUserWithFiles(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: { profile: true, projects: { include: { media: true } } },
  });
  if (!user) return;
  await db.user.delete({ where: { id } });
  const files = [
    user.profile?.avatarUrl,
    user.profile?.coverUrl,
    ...user.projects.flatMap((p) => [p.coverUrl, ...p.media.map((m) => m.url)]),
  ];
  await Promise.all(files.map(deleteUpload));
}
