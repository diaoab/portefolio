"use client";

import { useActionState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { deleteOwnAccount, updateNotifications } from "../actions";

export function NotificationsForm({ notifyEmail }: { notifyEmail: boolean }) {
  const [state, action] = useActionState(updateNotifications, undefined);
  const t = useT();
  return (
    <form action={action} className="card space-y-4 p-6">
      <h2 className="flex items-center gap-2 font-semibold"><Bell className="size-4 text-brand" /> {t.danger.notifyTitle}</h2>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" name="notifyEmail" defaultChecked={notifyEmail} className="size-4 accent-[#7c5cff]" />
        {t.danger.notifyLabel}
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-ghost" pendingText={t.common.saving}>{t.common.save}</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteOwnAccount, undefined);
  const t = useT().danger;
  return (
    <form action={action} className="card space-y-4 border-red-500/30 p-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold text-red-300"><Trash2 className="size-4" /> {t.title}</h2>
        <p className="mt-1 text-sm text-muted">{t.text}</p>
      </div>
      <div>
        <label className="label" htmlFor="delete-password">{t.password}</label>
        <input id="delete-password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-danger" confirm={t.confirm}>{t.submit}</SubmitButton>
    </form>
  );
}
