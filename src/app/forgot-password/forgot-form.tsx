"use client";

import { useActionState } from "react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { requestPasswordReset } from "../login/actions";

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  const t = useT();
  if (state?.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">{t.login.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText={t.forgot.pending}>{t.forgot.submit}</SubmitButton>
    </form>
  );
}
