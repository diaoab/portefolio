"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { FormMessage, SubmitButton } from "@/components/ui";
import { sendMessage } from "../actions";

export function ContactForm({ slug, name }: { slug: string; name: string }) {
  const [state, action] = useActionState(sendMessage, undefined);

  if (state?.ok) {
    return <FormMessage state={state} />;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="c-name">Votre nom</label>
          <input id="c-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="c-email">Votre email</label>
          <input id="c-email" name="email" type="email" required className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="c-subject">Objet</label>
        <input id="c-subject" name="subject" className="input" placeholder="Proposition de collaboration" />
      </div>
      <div>
        <label className="label" htmlFor="c-body">Message</label>
        <textarea id="c-body" name="body" required rows={5} className="input" placeholder={`Bonjour ${name.split(" ")[0]}, …`} />
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto" pendingText="Envoi…">
        <Send className="size-4" /> Envoyer le message
      </SubmitButton>
    </form>
  );
}
