import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { getT } from "@/lib/i18n-server";
import { findResetToken } from "../../login/actions";
import { ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).reset.title, robots: { index: false } };
}

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getT();
  const valid = await findResetToken(token);
  return (
    <AuthCard title={t.reset.title} intro={valid ? t.reset.intro : t.reset.invalid} footer={{ href: "/login", label: t.forgot.back }}>
      {valid ? (
        <ResetForm token={token} />
      ) : (
        <Link href="/forgot-password" className="btn-primary w-full">{t.reset.newRequest}</Link>
      )}
    </AuthCard>
  );
}
