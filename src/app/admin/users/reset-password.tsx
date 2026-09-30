"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { SubmitButton } from "@/components/ui";
import { resetPassword } from "../actions";

export function ResetPasswordButton({ id, email }: { id: string; email: string }) {
  const [state, action] = useActionState(resetPassword, undefined);
  const t = useT().admin;
  return (
    <form action={action} className="contents">
      <input type="hidden" name="id" value={id} />
      {state?.password ? (
        <code className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300" title={t.newPassword}>
          {state.password}
        </code>
      ) : (
        <SubmitButton
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
          confirm={t.confirmReset(email)}
        >
          <KeyRound className="size-4" />
          <span className="sr-only">{t.resetPassword}</span>
        </SubmitButton>
      )}
    </form>
  );
}
