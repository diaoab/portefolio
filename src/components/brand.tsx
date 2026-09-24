import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { initials } from "@/lib/utils";

export async function Logo({ href = "/" }: { href?: string }) {
  const { siteName, logoUrl } = await getSettings();
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2 font-display text-lg font-bold tracking-tight">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="size-8 shrink-0 rounded-lg object-contain" />
      ) : (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-2 text-sm text-white shadow-lg shadow-brand/30">
          {siteName.trim().charAt(0).toUpperCase() || "F"}
        </span>
      )}
      <span className="truncate">{siteName}</span>
    </Link>
  );
}

export function Avatar({
  name,
  src,
  size = 48,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: size * 0.36 };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={style} className={`rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand/80 to-brand-2/80 font-semibold text-white ${className}`}
    >
      {initials(name) || "?"}
    </span>
  );
}
