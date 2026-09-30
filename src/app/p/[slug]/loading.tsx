/** Squelette d'un portfolio pendant son chargement. */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy>
      <div className="h-16 border-b border-line" />
      <div className="h-56 bg-white/[0.03] sm:h-72" />
      <div className="container-page -mt-20 flex items-end gap-6">
        <div className="size-[140px] shrink-0 rounded-full border-4 border-ink bg-white/[0.08]" />
        <div className="mb-4 flex-1 space-y-3">
          <div className="h-9 w-2/3 max-w-md rounded-lg bg-white/[0.08]" />
          <div className="h-5 w-1/3 max-w-xs rounded-lg bg-white/[0.06]" />
        </div>
      </div>
      <div className="container-page mt-14 grid gap-5 sm:grid-cols-2">
        {[0, 1].map((i) => <div key={i} className="card aspect-[16/10]" />)}
      </div>
    </div>
  );
}
