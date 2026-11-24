"use client";

import { PantallaError } from "@/components/pantalla-error";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <PantallaError {...props} inicio="/tablero" />;
}
