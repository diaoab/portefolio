import { PageHeader } from "@/components/app-shell";
import { PasswordForm } from "./password-form";

export const metadata = { title: "Sécurité" };

export default function AccountPage() {
  return (
    <div className="max-w-lg">
      <PageHeader title="Sécurité" description="Changez le mot de passe fourni par l'administrateur." />
      <PasswordForm />
    </div>
  );
}
