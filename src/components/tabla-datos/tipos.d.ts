import "@tanstack/react-table";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    claseCabecera?: string;
    claseCelda?: string;
    /** Ocultar la columna en pantallas pequeñas. */
    ocultarEnMovil?: boolean;
  }
}
