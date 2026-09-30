import type { Metadata } from "next";
import { Inbox, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { SubmitButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n-server";
import { deleteMessage, toggleMessageRead } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).messages.title };
}

const iconBtn = "rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white";

export default async function MessagesPage() {
  const user = await requireUser();
  const messages = await db.message.findMany({ where: { toUserId: user.id }, orderBy: { createdAt: "desc" } });
  const [locale, dict] = await Promise.all([getLocale(), getT()]);
  const t = dict.messages;

  return (
    <div className="max-w-4xl">
      <PageHeader title={t.title} description={t.description} />
      {messages.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-12 text-center">
          <Inbox className="size-10 text-zinc-600" />
          <p className="font-medium">{t.empty}</p>
          <p className="text-sm text-muted">{t.emptyText}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`card p-5 ${m.read ? "" : "border-brand/40"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {!m.read && <span className="mr-2 inline-block size-2 rounded-full bg-brand align-middle" />}
                    {m.subject || t.noSubject}
                  </p>
                  <p className="text-sm text-muted">
                    {m.name} · {m.email} · {formatDate(m.createdAt, locale)}
                  </p>
                </div>
                <div className="flex items-center">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || t.yourMessage}`)}`}
                    className={iconBtn}
                    title={t.reply}
                  >
                    <Reply className="size-4" />
                  </a>
                  <form action={toggleMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <SubmitButton className={iconBtn}>
                      {m.read ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
                      <span className="sr-only">{m.read ? t.markUnread : t.markRead}</span>
                    </SubmitButton>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <SubmitButton className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400" confirm={t.confirmDelete}>
                      <Trash2 className="size-4" />
                    </SubmitButton>
                  </form>
                </div>
              </div>
              <p className="prose-content mt-3 text-sm">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
