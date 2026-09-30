"use client";

import { useActionState } from "react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { changePassword } from "../actions";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  const t = useT().account;
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="current">{t.current}</label>
        <input id="current" name="current" type="password" required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="next">{t.next}</label>
        <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">{t.confirm}</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton pendingText={t.pending}>{t.submit}</SubmitButton>
    </form>
  );
}
