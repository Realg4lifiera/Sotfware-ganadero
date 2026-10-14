import type { Metadata } from "next";
import Image from "next/image";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const { desde } = await searchParams;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--accent),transparent_60%)] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo-campo-verde.webp"
            alt="Campo Verde"
            width={180}
            height={233}
            priority
            className="h-auto w-36"
          />
        </div>
        <div className="bg-card rounded-xl border p-6 shadow-sm">
          <h1 className="mb-1 text-2xl font-semibold">Iniciar sesión</h1>
          <p className="text-muted-foreground mb-5 text-sm">Software ganadero de la finca</p>
          <FormularioLogin desde={typeof desde === "string" ? desde : undefined} />
        </div>
      </div>
    </main>
  );
}
