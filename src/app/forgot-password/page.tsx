import type { Metadata } from "next";
import { AuthCard } from "@/components/auth-card";
import { getT } from "@/lib/i18n-server";
import { ForgotForm } from "./forgot-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).forgot.title, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const t = (await getT()).forgot;
  return (
    <AuthCard title={t.title} intro={t.intro} footer={{ href: "/login", label: t.back }}>
      <ForgotForm />
    </AuthCard>
  );
}
