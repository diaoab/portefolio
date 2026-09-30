import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).login.title, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard");
  const { next, reset } = await searchParams;
  const t = await getT();

  return (
    <AuthCard title={t.login.welcome} intro={t.login.intro} footer={{ href: "/", label: t.login.back }}>
      {reset && (
        <p className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-300">{t.reset.done}</p>
      )}
      <LoginForm next={next} />
      <div className="mt-5 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <Link href="/forgot-password" className="text-zinc-300 underline-offset-4 hover:underline">{t.forgot.link}</Link>
        <span>{t.login.noAccount}</span>
      </div>
    </AuthCard>
  );
}
