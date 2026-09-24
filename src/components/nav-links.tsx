"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Home, Inbox, KeyRound, Settings, ShieldCheck, UserRound, Users } from "lucide-react";

const ICONS = {
  home: Home,
  profile: UserRound,
  projects: FolderKanban,
  inbox: Inbox,
  account: KeyRound,
  admin: ShieldCheck,
  users: Users,
  settings: Settings,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; exact?: boolean };

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active ? "bg-white/[0.08] text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
            }`}
          >
            <Icon className="size-4" />
            {item.label}
            {!!item.badge && (
              <span className="ml-auto rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
