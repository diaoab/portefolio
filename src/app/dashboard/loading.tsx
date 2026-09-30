/** Squelette affiché pendant le chargement des pages de l'espace utilisateur. */
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy>
      <div className="mb-8 h-8 w-64 rounded-lg bg-white/[0.06]" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="card h-28" />)}
      </div>
      <div className="card mt-8 h-64" />
    </div>
  );
}
