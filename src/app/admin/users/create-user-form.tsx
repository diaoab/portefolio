"use client";

import { useActionState, useState } from "react";
import { Check, Copy, UserPlus } from "lucide-react";
import { SubmitButton } from "@/components/ui";
import { createUser } from "../actions";

export function CreateUserForm() {
  const [state, action] = useActionState(createUser, undefined);
  const [copied, setCopied] = useState(false);

  return (
    <div className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <UserPlus className="size-4 text-brand" /> Créer un utilisateur
      </h2>
      <form action={action} className="space-y-3" key={state?.created?.email}>
        <div>
          <label className="label" htmlFor="fullName">Nom complet</label>
          <input id="fullName" name="fullName" required className="input" placeholder="Awa Diallo" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" placeholder="awa@exemple.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input id="password" name="password" className="input" placeholder="Laisser vide pour générer" minLength={8} />
        </div>
        <div>
          <label className="label" htmlFor="role">Rôle</label>
          <select id="role" name="role" className="input">
            <option value="USER">Utilisateur</option>
            <option value="SUPER_ADMIN">Super admin</option>
          </select>
        </div>
        {state?.error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{state.error}</p>
        )}
        <SubmitButton className="btn-primary w-full" pendingText="Création…">Créer le compte</SubmitButton>
      </form>

      {state?.created && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <p className="font-medium text-emerald-300">Compte créé pour {state.created.name} ✓</p>
          <p className="mt-1 text-emerald-200/80">Transmettez ces identifiants à l&apos;utilisateur :</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-zinc-200">
            {`Email : ${state.created.email}\nMot de passe : ${state.created.password}`}
          </pre>
          <button
            type="button"
            className="btn-ghost mt-2 w-full"
            onClick={() => {
              navigator.clipboard.writeText(
                `Connexion : ${location.origin}/login\nEmail : ${state.created!.email}\nMot de passe : ${state.created!.password}`,
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copié" : "Copier les identifiants"}
          </button>
        </div>
      )}
    </div>
  );
}
