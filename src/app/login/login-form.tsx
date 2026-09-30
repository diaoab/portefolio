"use client";

import { useActionState } from "react";
import { useT } from "@/components/i18n-provider";
import { FormMessage, SubmitButton } from "@/components/ui";
import { login } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(login, undefined);
  const t = useT().login;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <label className="label" htmlFor="email">{t.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="vous@exemple.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t.password}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText={t.pending}>{t.submit}</SubmitButton>
    </form>
  );
}
