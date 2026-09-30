"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { Turnstile } from "@/components/turnstile";
import { FormMessage, SubmitButton } from "@/components/ui";
import { sendMessage } from "../actions";

export function ContactForm({ slug, name }: { slug: string; name: string }) {
  const [state, action] = useActionState(sendMessage, undefined);
  const t = useT().contact;

  if (state?.ok) {
    return <FormMessage state={state} />;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">{t.yourName}</label>
          <input id="c-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">{t.yourEmail}</label>
          <input id="c-email" name="email" type="email" required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-subject">{t.subject}</label>
        <input id="c-subject" name="subject" className="input" placeholder={t.subjectPlaceholder} />
      </div>
      <div>
        <label className="label" htmlFor="c-body">{t.message}</label>
        <textarea id="c-body" name="body" required rows={5} className="input" placeholder={t.messagePlaceholder(name.split(" ")[0]!)} />
      </div>
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto" pendingText={t.sending}>
        <Send className="size-4" /> {t.send}
      </SubmitButton>
    </form>
  );
}
