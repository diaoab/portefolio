"use client";

import { useActionState, useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { SubmitButton } from "@/components/ui";
import { createUser } from "../actions";

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, undefined);
  const [copied, setCopied] = useState(false);
  const t = useT().admin;

  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <UserPlus className="size-4 text-brand" /> {t.createUser}
      </h2>
      <form action={action} className="space-y-3" key={state?.created?.email}>
        <div>
          <label className="label" htmlFor="fullName">{t.fullName}</label>
          <input id="fullName" name="fullName" required className="input" placeholder="Awa Diallo" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t.email}</label>
          <input id="email" name="email" type="email" required className="input" placeholder={t.emailPlaceholder} />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.password}</label>
          <input id="password" name="password" className="input" placeholder={t.passwordPlaceholder} minLength={8} />
        </div>
        <div>
          <label className="label" htmlFor="role">{t.role}</label>
          <select id="role" name="role" className="input">
            <option value="USER">{t.roleUser}</option>
            <option value="SUPER_ADMIN">{t.roleAdmin}</option>
          </select>
        </div>
        {state?.error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{state.error}</p>
        )}
        <SubmitButton className="btn-primary w-full" pendingText={t.creating}>{t.create}</SubmitButton>
      </form>

      {state?.created && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-emerald-300">{t.createdFor(state.created.name)}</p>
          <p className="mt-1 text-emerald-200/80">{t.sendCredentials}</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-zinc-200">
            {t.credentials(state.created.email, state.created.password)}
          </pre>
          <button
            type="button"
            className="btn-ghost mt-2 w-full"
            onClick={() => {
              navigator.clipboard.writeText(t.credentialsCopy(location.origin, state.created!.email, state.created!.password));
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t.copied : t.copy}
          </button>
        </div>
      )}
    </div>
  );
}
