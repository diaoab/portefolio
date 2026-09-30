"use client";

import { useActionState } from "react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { resetPasswordWithToken } from "../../login/actions";

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordWithToken, undefined);
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="next">{t.account.next}</label>
        <input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">{t.account.confirm}</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText={t.common.saving}>{t.reset.submit}</SubmitButton>
    </form>
  );
}
