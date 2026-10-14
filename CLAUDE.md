# Software Ganadero — Campo Verde

@AGENTS.md

## Contexto

Software para **una sola finca** lechera/ganadera en Colombia (una finca por instalación,
dividida en potreros y lotes). Cuatro módulos comparten un **registro único de animales**:

1. **Costos de producción** — compras/gastos, insumos, nómina (mano de obra), gastos
   administrativos (costos indirectos con período y prorrateo), activos y depreciación,
   ingresos (venta de leche, animales, otros), presupuesto e indicadores de costo.
2. **Gestión reproductiva** — celos, servicios (monta / IA), diagnósticos de preñez, partos,
   abortos, secados, toros y pajillas, genealogía, alertas.
3. **Gestión productiva** — ordeños, lactancias, entregas y consumo interno de leche,
   pesajes, lotes y potreros (rotación), alimentación, sanidad.
4. **Reportes** — tablero principal e informes filtrables exportables a PDF y Excel.

**Principio:** todo evento (costo, reproductivo o productivo) queda ligado a un animal o a
un lote y alimenta los reportes sin volver a digitarse.

### Referente del cliente: app "Costos de producción" de Colanta

El cliente usaba la app de costos de Colanta y un Excel con su formato. Nuestro sistema
replica sus conceptos (no se integra con Colanta):

- **Rubros de costo** (agrupados como en el Excel "Costo de litro"):
  - _Costos fijos:_ mantenimiento de equipos, mano de obra, servicios públicos e impuestos,
    arriendos, depreciaciones, retención en la fuente.
  - _Costos variables:_ alimentación, pasturas, sanidad animal, reproducción, insumos de
    operación, combustibles y lubricantes, transporte de leche e insumos.
  - _Gastos empresariales:_ gastos financieros, servicios técnicos, otros gastos.
- **Compras:** artículo, presentación, unidad, contenido/peso, proveedor (NIT), marca, valor
  unitario, cantidad, descuento, % IVA, total, categoría, fecha, notas, origen
  (cooperativa / externa).
- **Nómina:** trabajador, tipo de contrato (con/sin prestaciones), salario, auxilio de
  transporte, salud, pensión, ARL (riesgo), prima, vacaciones, cesantías, intereses de
  cesantías, bonificación, costo total. Es registro de costo, **no** nómina electrónica DIAN.
- **Gastos administrativos:** impuesto predial, servicios públicos, arriendo, gastos
  financieros y otros (mantenimiento equipo agroindustrial, flete insumo, transporte de leche
  —con litros—, retención en la fuente, servicio técnico, cuota admisión, fondo de
  estabilización de la leche). Cada uno con período (mensual…anual) que se reparte por mes.
- **Consumo interno de leche:** litros trabajadores, terneras, retiro y arriendo (+ valor $).
- **Otros ingresos:** terneros, animales de descarte, otros (cantidad × valor unitario).
- **Informe del productor (mensual):** rubros con total, $/L y % de participación; litros
  producidos y vendidos, precio de venta, ingresos, gastos, utilidad, rentabilidad
  (= utilidad / ingresos), costo / litros producidos y costo / litros vendidos (se muestran
  **ambos**; el tablero usa litros producidos).
- **Composición del hato:** categorías con % real vs **% ideal configurable**.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript estricto.
  `cacheComponents` está **desactivado**: toda página es dinámica (depende de la sesión).
  En Next 16 el middleware se llama `src/proxy.ts`. Lee `node_modules/next/dist/docs/`
  antes de usar APIs de Next que no conozcas bien.
- PostgreSQL (Neon en producción, local con docker-compose) + Prisma 7 (`prisma-client`
  generator con salida en `src/generated/prisma`, adaptador `@prisma/adapter-pg`,
  configuración en `prisma.config.ts`).
- Auth.js v5 (`next-auth@5.0.0-beta.32`, versión fija) con credenciales y sesión JWT;
  contraseñas con `bcryptjs`.
- Tailwind CSS 4 + componentes estilo shadcn/ui en `src/components/ui`; React Hook Form +
  Zod 4; TanStack Table v8; exceljs; Vercel Blob (detrás de `lib/almacenamiento`).
- Vitest para pruebas unitarias. Despliegue en Vercel.

## Reglas

- **Idioma:** interfaz en español de Colombia. Código del dominio en español (`animal`,
  `potrero`, `lote`, `parto`…); términos técnicos genéricos pueden ir en inglés.
- **Dinero:** COP en `Decimal(16,2)`; litros `Decimal(10,2)`; kg `Decimal(8,2)`. Nunca
  `float` para dinero. Formato en pantalla con `lib/formato.ts` (`$ 1.250.000`, `12,5 L`).
- **Fechas:** zona `America/Bogota` (`lib/fechas.ts`). Fechas de evento de un día se guardan
  como `@db.Date`.
- **Borrado lógico** (`deletedAt`) en entidades de negocio; la interfaz nunca borra físico.
- **Permisos en un solo lugar** (`lib/permisos.ts`) y validados en el servidor: toda server
  action pasa por `accion()` de `lib/accion.ts`, que relee usuario activo + rol de la BD.
- **Auditoría centralizada:** la extensión de Prisma en `lib/auditoria.ts` registra cada
  crear/editar/eliminar con antes/después. No uses `updateMany`/`deleteMany` en modelos
  auditados (están bloqueados).
- **Estado reproductivo** solo cambia vía `lib/dominio/reproduccion.ts` (máquina de
  estados), nunca editándolo a mano. "En producción" se deriva de una lactancia abierta.
- **Categoría del animal** se calcula (`lib/dominio/categoria.ts`) con reglas
  configurables guardadas en la finca; no se guarda a mano.
- Mobile-first: formularios de campo usables a 375 px.
- Todo debe poder exportarse a Excel (los datos son del cliente).
- **Fuera de alcance:** app nativa, modo sin conexión, facturación/nómina electrónica DIAN,
  contabilidad formal, integración con básculas/RFID/ordeñadoras/Colanta, multifinca,
  módulo agrícola.
- Si algo del dominio es ambiguo, **pregunta** en vez de inventar la regla.

## Roles

| Rol           | Acceso                                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`       | Total                                                                                                                                                 |
| `MAYORDOMO`   | Registra eventos reproductivos, pesajes, ordeños, consumo/entregas de leche, gastos de campo y traslados de lote/potrero; consulta animales y sanidad |
| `VETERINARIO` | Módulo reproductivo, sanidad, hojas de vida; ve costos de sanidad y reproducción; reportes reproductivos                                              |
| `CONTADOR`    | Costos y reportes en solo lectura; consulta animales; exporta                                                                                         |

La matriz exacta está en `src/lib/permisos.ts`.

## Máquina de estados reproductiva (aprobada)

| Evento               | Desde                                                    | Hacia                                               |
| -------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| Servicio             | NOVILLA, VACIA, PARIDA, SERVIDA                          | SERVIDA                                             |
| Diagnóstico positivo | SERVIDA (y NOVILLA/VACIA/PARIDA por monta no registrada) | PREÑADA                                             |
| Diagnóstico negativo | SERVIDA, PREÑADA                                         | VACIA (NOVILLA si nunca ha parido)                  |
| Parto                | PREÑADA, SECA                                            | PARIDA (abre lactancia)                             |
| Aborto               | PREÑADA, SECA                                            | VACIA (NOVILLA si nunca ha parido)                  |
| Secado               | PREÑADA con lactancia abierta                            | SECA (cierra lactancia)                             |
| Secado de no preñada | PARIDA / VACIA / SERVIDA con lactancia                   | cierra lactancia; PARIDA → VACIA                    |
| Celo, descarte       | —                                                        | sin cambio (descarte cambia el _estado_ del animal) |

## Categorías del inventario (aprobadas, edades configurables)

Ternera lactante (< 8 meses) · Ternera (8–12 meses) · Novilla (≥ 12 meses sin partos) ·
Vaca en producción (lactancia abierta) · Vaca seca (ya parió, sin lactancia abierta) ·
Macho levante/ceba (todo macho bovino que no es toro) · Toro (macho registrado como `Toro`) ·
Otras especies (equinos, etc.). Reglas en `src/lib/dominio/categoria.ts`.

## Convenciones de código (cómo se construye cada módulo)

- **Escrituras:** toda server action que escribe usa `accion(permiso, async ({ tx, usuario }) => …)`
  de `lib/accion.ts` y escribe SIEMPRE con `tx` (transacción auditada). Devuelve
  `ResultadoAccion` (`{ ok, datos } | { ok: false, error, erroresCampo }`). Los errores de
  negocio se lanzan como `ErrorNegocio(mensaje, erroresCampo?)`.
- **Lecturas:** con `prismaBase` (`lib/db.ts`), filtrando `deletedAt: null`.
- **Páginas:** empiezan con `await requierePermiso("…")` (redirige o responde 403).
- **Auditoría:** automática (extensión de Prisma). No usar `delete`, `createMany`,
  `updateMany` ni `deleteMany` en modelos auditados; las escrituras anidadas (nested
  create) no se auditan por separado: crear cada registro con su propia llamada.
- **Formularios:** declarativos con `DefCampo` (`lib/formularios/campos.ts`):
  `esquemaDesdeCampos()` da el esquema Zod que usan cliente (RHF + zodResolver) y servidor.
  Al servidor se envían los valores crudos (`getValues()`), que vuelve a validar.
  Formularios que se renderizan en el servidor pasan `valorInicial` y deshabilitan el
  botón hasta hidratar (`useHidratado`).
- **Catálogos:** se declaran en `lib/catalogos/definiciones.ts` + `servidor.ts` y
  aparecen solos en `/configuracion/[catalogo]`.
- **Tablas:** `components/tabla-datos/tabla-datos.tsx` (TanStack Table v8); en celular
  ocultar columnas secundarias con `meta: { ocultarEnMovil: true }`.
- **Archivos:** `almacenamiento()` de `lib/almacenamiento` (local en desarrollo, Vercel Blob
  privado en producción), servidos por `/api/archivos/[...clave]` con sesión.
- **Excel:** exceljs en `lib/excel/`; la validación de importación es una función pura
  (`validar-animales.ts`) que recibe los catálogos.
- **Enums:** etiquetas en español en `lib/etiquetas.ts`.
- **Indicadores:** funciones puras con pruebas en `lib/indicadores/` (hoy: GDP).
- **Mensajes:** en español, neutros en género ("Este dato es obligatorio.").

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run check        # lint + typecheck + pruebas (correr antes de cada commit)
npm run test:bd      # incluye pruebas de integración contra la BD local
npm run db:migrate   # crear/aplicar migraciones en desarrollo
npm run db:seed      # cargar datos de prueba
npm run db:reset     # borrar BD, migrar y sembrar
npm run db:inicial   # carga inicial de producción (FINCA_NOMBRE, ADMIN_CLAVE)
```

Si el servidor de desarrollo muestra comportamiento viejo tras editar archivos del
servidor, reinícialo (la recarga en caliente a veces no toma los cambios).

Usuarios del seed (contraseña `ganadero123`): `admin`, `mayordomo`, `veterinario`, `contador`.

## Estructura

```
prisma/            schema.prisma, migrations/, seed.ts, inicial.ts, catalogos-base.ts
src/proxy.ts       exige sesión
src/app/(auth)     login
src/app/(app)      tablero, animales, costos, reproduccion, produccion, reportes,
                   configuracion, cuenta, auditoria
src/app/api        archivos, exportar/animales, plantilla/animales, auth
src/lib            db, auth, sesion, permisos, accion, auditoria, traducir-error,
                   navegacion, etiquetas, almacenamiento/, formato, fechas, dominio/,
                   servicios/, validaciones/, formularios/, catalogos/, excel/, indicadores/
src/components     ui/ (estilo shadcn sobre Radix), layout/, tabla-datos/, formularios/
tests/             Vitest (tests/integracion/ requiere PRUEBAS_BD=1)
```

## Estado actual

Hecho (base): esquema completo de los 4 módulos, autenticación y roles, auditoría,
configuración y catálogos, usuarios, animales (listado, ficha, foto, movimientos, hoja de
vida, importación/exportación Excel), tablero con inventario real, máquina de estados
reproductiva y de categorías (con pruebas), páginas "Próximamente" para todo el alcance.

Siguiente: **Módulo 1 — Costos** (compras con IVA/descuento y soporte, nómina, gastos
administrativos con período y prorrateo, activos y depreciación, ingresos, presupuesto,
indicadores de costo e informe del productor). Las rutas ya existen en `src/app/(app)/costos`
y su alcance está descrito en `lib/navegacion.ts`.

Notas para Módulo 2: el servicio reproductivo debe usar `aplicarEvento()` de
`lib/dominio/reproduccion.ts` y aplicar sus efectos (estado, `numeroPartos`, abrir/cerrar
`Lactancia`); el parto crea las crías con `insertarAnimal()` de `lib/servicios/animales.ts`.

## Glosario de indicadores (PENDIENTES DE VALIDACIÓN con el veterinario)

Se implementarán como funciones puras con pruebas en `src/lib/indicadores/`.

- **Intervalo entre partos (IEP):** días entre dos partos consecutivos de la misma vaca.
- **Días abiertos:** días desde el parto hasta la concepción (servicio con preñez confirmada).
- **Servicios por concepción:** total de servicios / preñeces confirmadas.
- **Tasa de preñez:** hembras preñadas / hembras aptas expuestas en el período.
- **Edad al primer parto:** edad de la hembra en su primer parto.
- **Días en leche:** días desde el parto hasta la fecha o hasta el secado.
- **Producción ajustada a 305 días:** producción de la lactancia normalizada a 305 días.
- **Ganancia diaria de peso (GDP):** (peso final − peso inicial) / días entre pesajes, g/día.
- **Costo por litro:** costos asignados a lechería / litros producidos en el período
  (también se muestra / litros vendidos, como el informe Colanta).
- **Costo por kilo ganado:** costos asignados a ceba/levante / kilos ganados en el período.
- **Costo por animal/día:** costos del período / (animales × días).
- **Litros por vaca/día** y **litros por hectárea**.
- **Carga animal:** unidades animales por hectárea.
- **Rentabilidad:** utilidad del período / ingresos del período.
