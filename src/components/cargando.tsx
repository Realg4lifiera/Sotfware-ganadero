/**
 * Esqueleto de página mientras el servidor responde (loading.tsx): aparece al instante al
 * navegar, para que en el campo, con mala señal, se note que la app está trabajando.
 */
export function Cargando() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-5">
      <span className="sr-only">Cargando…</span>
      <div className="bg-primary/70 fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse print:hidden" />
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-8 w-56 max-w-full animate-pulse rounded-md" />
        <div className="bg-muted/70 h-4 w-80 max-w-full animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-muted/60 h-28 animate-pulse rounded-xl" />
        ))}
      </div>
      <div className="bg-muted/50 h-72 animate-pulse rounded-xl" />
    </div>
  );
}
