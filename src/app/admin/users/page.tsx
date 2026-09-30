import type { Metadata } from "next";
import Link from "next/link";
import { Eye, EyeOff, Power, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Avatar } from "@/components/brand";
import { SubmitButton } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n-server";
import { deleteUser, toggleActive, togglePublished } from "../actions";
import { CreateUserForm } from "./create-user-form";
import { ResetPasswordButton } from "./reset-password";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).admin.users };
}

const iconBtn = "rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireAdmin();
  const q = (await searchParams).q?.trim() ?? "";
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { profile: { fullName: { contains: q, mode: "insensitive" } } }] } : undefined,
    orderBy: { createdAt: "desc" },
    include: { profile: true, _count: { select: { projects: true, messages: true } } },
  });
  const dict = await getT();
  const t = dict.admin;

  return (
    <>
      <PageHeader title={t.users} description={t.usersIntro} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card min-w-0 overflow-hidden">
          <form className="border-b border-line p-4">
            <input name="q" defaultValue={q} className="input" placeholder={t.searchUsers} />
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="p-4 font-medium">{t.colUser}</th>
                  <th className="p-4 font-medium">{t.colStatus}</th>
                  <th className="p-4 font-medium">{t.colContent}</th>
                  <th className="p-4 text-right font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => {
                  const self = u.id === admin.id;
                  return (
                    <tr key={u.id} className="align-middle">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.profile?.fullName ?? u.email} src={u.profile?.avatarUrl} size={36} />
                          <div className="min-w-0">
                            <p className="font-medium">
                              {u.profile?.fullName}
                              {u.role === "SUPER_ADMIN" && <span className="badge ml-2 border-brand/40 text-violet-300">{t.adminBadge}</span>}
                            </p>
                            <p className="text-xs text-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`badge ${u.active ? "text-emerald-300" : "text-red-300"}`}>
                            {u.active ? t.active : t.disabled}
                          </span>
                          {u.profile?.published ? (
                            <Link href={`/p/${u.profile.slug}`} target="_blank" className="badge text-cyan-300 hover:bg-white/10">{t.published}</Link>
                          ) : (
                            <span className="badge text-zinc-500">{dict.common.draft}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-muted">
                        {t.projectsCount(u._count.projects)}
                        <br />
                        {t.messagesCount(u._count.messages)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <ResetPasswordButton id={u.id} email={u.email} />
                          <form action={togglePublished}>
                            <input type="hidden" name="id" value={u.id} />
                            <SubmitButton className={iconBtn}>
                              {u.profile?.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              <span className="sr-only">{u.profile?.published ? t.unpublish : t.publish}</span>
                            </SubmitButton>
                          </form>
                          {!self && (
                            <>
                              <form action={toggleActive}>
                                <input type="hidden" name="id" value={u.id} />
                                <SubmitButton className={`${iconBtn} ${u.active ? "" : "text-red-400"}`}>
                                  <Power className="size-4" />
                                  <span className="sr-only">{u.active ? t.deactivate : t.activate}</span>
                                </SubmitButton>
                              </form>
                              <form action={deleteUser}>
                                <input type="hidden" name="id" value={u.id} />
                                <SubmitButton
                                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                                  confirm={t.confirmDelete(u.email)}
                                >
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">{dict.common.delete}</span>
                                </SubmitButton>
                              </form>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted">{t.noUsers}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line p-4 text-xs text-muted">
            {t.legend}
          </p>
        </div>
        <div>
          <CreateUserForm />
        </div>
      </div>
    </>
  );
}
