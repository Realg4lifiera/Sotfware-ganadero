# Software Ganadero — Campo Verde

@AGENTS.md

## Contexto

Software lechero/ganadero en Colombia para **una persona que administra varias fincas
independientes** (no es dueña de ellas) con los mismos parámetros. Cada finca está dividida
en potreros y lotes y lleva sus propios datos; al entrar se ve primero "Mis fincas" (resumen
de todas) y luego el manejo de la elegida. En cada finca, cuatro módulos comparten un
**registro único de animales**:

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
  contabilidad formal, integración con básculas/RFID/ordeñadoras/Colanta,
  consolidado contable entre fincas, módulo agrícola.
- Si algo del dominio es ambiguo, **pregunta** en vez de inventar la regla.

## Roles

| Rol           | Acceso                                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ADMIN`       | Total                                                                                                                                                 |
| `MAYORDOMO`   | Registra eventos reproductivos, pesajes, ordeños, consumo/entregas de leche, gastos de campo y traslados de lote/potrero; consulta animales y sanidad |
| `VETERINARIO` | Módulo reproductivo, sanidad, hojas de vida; ve costos de sanidad y reproducción; reportes reproductivos                                              |
| `CONTADOR`    | Costos y reportes en solo lectura; consulta animales; exporta                                                                                         |
| `PROPIETARIO` | Dueño de una finca: consulta todo (animales, reproducción, sanidad, costos, reportes) y exporta; no registra nada                                     |

El `ADMIN` entra a todas las fincas y es el único que las crea. Los demás roles entran solo
a las fincas asignadas (`UsuarioFinca`); con una sola, entran directo.

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

### Multifinca (`lib/finca.ts`, `lib/finca-sesion.ts`)

- Los modelos de `MODELOS_POR_FINCA` llevan `fincaId`; la extensión de Prisma lo pone en
  todo `create` y lo agrega al `where` de toda consulta, según la finca del contexto
  (`AsyncLocalStorage`). **No filtres ni asignes `fincaId` a mano.** Sin finca, esas
  consultas lanzan `ErrorSinFinca` (y el `@default(0)` del esquema lo rechaza la FK).
- Compartidos entre fincas (sin `fincaId`): razas, rubros, categorías de gasto, insumos,
  proveedores, usuarios. Por finca: todo lo demás (lotes, potreros, centros de costo,
  toros, pajillas, trabajadores, compradores, configuración en `Finca.configuracion`).
- La finca activa sale de la cookie `finca`, validada contra el acceso del usuario
  (`fincaActual()`). `accion()` y `requierePermiso()` la exigen; las rutas de `app/api`
  se envuelven con `enFinca(manejar)`; scripts y pruebas usan `conFinca(id, fn)`.
- Acciones de toda la instalación (usuarios, fincas) pasan `{ global: true }` a `accion()`
  y sus páginas usan `requierePermisoGlobal()`: corren sin finca y su auditoría queda con
  `fincaId` nulo (visible desde todas las fincas).
- Las escrituras anidadas (nested create) **no** pasan por la extensión: llevan `fincaId`
  explícito. Las consultas de Prisma son perezosas: dentro de `contextoFinca.run()` hay
  que esperarlas (`async () => await …`), o correrían fuera del contexto.
- Los únicos de negocio son por finca (`@@unique([fincaId, numero])`, etc.);
  `traducirError` ignora `fincaId` al nombrar el campo duplicado.
- Nueva finca: `crearCentrosFinca()` (`lib/catalogos/centros-finca.ts`) dentro de
  `conFinca`, y opcionalmente copia `configuracion` de otra finca.

## Flujo de git (acordado con el usuario)

- Se trabaja con commits locales (uno por paso, mensaje en español).
- **Nunca hacer `git push` sin aprobación explícita del usuario.** Antes de subir, mostrar
  los commits pendientes (`git log origin/<rama>..HEAD`) con un resumen de cambios y
  esperar su "aprobado".
- No crear pull requests salvo que el usuario lo pida.

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

Usuarios del seed (contraseña `ganadero123`): `admin`, `mayordomo`, `veterinario`, `contador`,
`propietario`.

## Estructura

```
prisma/            schema.prisma, migrations/, seed.ts, inicial.ts, catalogos-base.ts
src/proxy.ts       exige sesión
src/app/(auth)     login
src/app/(inicio)   fincas (Mis fincas, entrar, gestionar): pantallas fuera de una finca
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

Hecho (Módulo 1 — Costos): compras y gastos (IVA/descuento, soportes; IVA como costo
configurable en Finca), nómina digitada a mano, gastos administrativos con período y reglas
de prorrateo, activos y depreciación, ingresos, entregas y consumo interno de leche,
presupuesto por categoría vs. ejecutado, indicadores de costo (12 meses) e informe del
productor (pantalla + Excel); el tablero muestra litros y costo por litro del mes.

- **Motor de costos** (`lib/dominio/motor-costos.ts`, puro): convierte compras, cuotas de
  administrativos, nómina y depreciación en `LineaCosto` (rubro, categoría, centro). Lo
  alimenta `lib/servicios/costos.ts` (`costosDelMes`, `informeDelMes`). Todo reporte de
  costos debe salir de ahí.
- Rubros que llena el sistema se reconocen por `RubroCosto.clave` (`MANO_OBRA`,
  `DEPRECIACIONES`); el centro Lechería por `CentroCosto.clave = LECHERIA`.
- Litros producidos = vendidos (entregas) + consumo interno. $/L de rubros sobre producidos.
- Pendiente del módulo: costo por kilo ganado y por animal/día (requieren pesajes e
  inventario histórico del Módulo 3).

Hecho (Módulo 2 — Reproductivo): pajillas (inventario del termo), parámetros reproductivos
en Finca, celos, servicios, diagnósticos, partos (crean las crías), abortos, secados,
descartes, historia reproductiva en la hoja de vida, genealogía con alerta de
consanguinidad, alertas (página + tablero) e indicadores con reporte y Excel.

- **Todo evento reproductivo** pasa por `lib/servicios/reproduccion.ts` → `aplicar()`:
  valida orden cronológico, aplica la máquina de estados, abre/cierra lactancia y escribe
  `HistorialReproductivo` (situación anterior). Solo se anula **el último** evento de cada
  hembra (`anularUltimoEvento`), que restaura todo (pajilla, lactancia, crías, vínculos).
- Parámetros aprobados (configurables): gestación 283 días, secar 60 días antes del parto,
  diagnóstico desde 35 días, ciclo 21, 120 días abiertos, aviso de parto 30 días.
- Pajillas: solo inventario; el costo del semen entra por Compras (no se cuenta dos veces).
- Descarte reproductivo = movimiento DESCARTE de Animales + motivo (queda descartada hasta
  su venta). Crías nacidas muertas no se registran (se anotan en observaciones).
- Indicadores reproductivos en `lib/indicadores/reproduccion.ts` (pendientes de validar).

Hecho (Módulo 3 — Productivo): control lechero (planilla por vaca) y totales por lote con
conciliación, lactancias con producción estimada y ajustada a 305, pesajes (individual y por
lote) y ganancia de peso, rotación de potreros con carga animal (UA/ha), alimentación por
lote, sanidad con retiros de leche/carne, reporte productivo y, en Costos, costo por kilo
ganado y por animal/día.

- Litros producidos del costo = entregas + consumo interno (Colanta); los ordeños sirven
  para el control por vaca y la conciliación. Un mismo ordeño no se registra por vaca y
  por lote a la vez.
- Producción de lactancia: curva por intervalos de control; ajustada a 305 proporcional
  (`lib/indicadores/lactancia.ts`, validado; control lechero cada 8 días).
- Carga animal en **UGG** (unidad gran ganado = 450 kg de peso vivo, referencia Fedegán;
  configurable en Finca): peso del último pesaje o, sin pesajes, peso estimado de su
  categoría (vaca 450 · novilla 320 · ternera 180 · lactante 80 · macho levante 300 ·
  toro 650 · otras 400), dividido por el peso de una UGG (`unidadesGranGanado`).
- Rotar un lote traslada a todos sus animales con su movimiento de potrero.
- Centros con clave: LECHERIA, CRIA_LEVANTE, CEBA (costo por kilo ganado).
- Retiros: un evento de lote cubre a sus animales; el de leche solo cuenta en vacas en
  producción.

Hecho (Módulo 4 — Reportes): reporte de costos filtrable (rango de meses; por rubro,
categoría, centro, lote, animal u origen), inventario con rotación mensual y composición
por lote/potrero, y PDF de todos los reportes (`components/boton-pdf.tsx` + `@media print`
en `globals.css`: imprimir con el navegador; marcar con `print:hidden` lo que no va al PDF).

- La rotación toma como salida el primer movimiento de descarte, venta o muerte.
- Las líneas del motor de costos llevan `loteId`/`animalId` cuando la compra o la nómina se
  asignó a un lote o animal.

Hecho (Multifinca): datos por finca con filtro automático, "Mis fincas" como pantalla de
inicio (animales, vacas en producción, litros y costo por litro del mes, alertas, retiros,
rentabilidad), cambio de finca desde el encabezado, gestión de fincas (crear copiando
parámetros, editar, desactivar), acceso de usuarios por finca y rol `PROPIETARIO`. El seed
trae dos fincas (Campo Verde y La Esperanza) y el usuario `propietario`.

Hecho (Validación con el veterinario, nov. 2026): glosario aprobado; carga en UGG; gastos
generales en el costo por kilo; días abiertos en curso de las vacas vacías; avisos de
pesajes y control lechero pendientes (`lib/dominio/alertas-productivas.ts`, página
`/produccion/pendientes` y tablero). Parámetros en `Finca.configuracion.produccion`:
control lechero cada 8 días; pesar terneras, novillas (levante) y machos de levante/ceba
cada 30 días; vacas y toros no se pesan (0). Sin pesajes, el aviso cuenta desde el ingreso;
el control lechero cuenta desde el parto o el último control (por vaca o por su lote).

Pendiente: conectar la base de datos de producción (Neon) y desplegar en Vercel.

## Glosario de indicadores (validado con el veterinario)

Funciones puras con pruebas en `src/lib/indicadores/`.

- **Intervalo entre partos (IEP):** días entre dos partos consecutivos de la misma vaca.
- **Días abiertos:** días desde el parto hasta la concepción (servicio con preñez confirmada).
  En vacas aún sin preñez (parida, vacía o servida) siguen corriendo hasta hoy ("abiertos hoy").
- **Vaca repetidora:** 3 servicios sin preñez en el ciclo; es el tope para evaluar descarte.
- **Servicios por concepción:** total de servicios / preñeces confirmadas.
- **Tasa de preñez:** hembras preñadas / hembras aptas expuestas en el período.
- **Edad al primer parto:** edad de la hembra en su primer parto.
- **Días en leche:** días desde el parto hasta la fecha o hasta el secado.
- **Producción ajustada a 305 días:** producción de la lactancia normalizada a 305 días
  (aunque la vaca dure más en lactancia por no preñarse, se compara a 305).
- **Ganancia diaria de peso (GDP):** (peso final − peso inicial) / días entre pesajes, g/día.
- **Costo por litro:** costos asignados a lechería / litros producidos en el período
  (también se muestra / litros vendidos, como el informe Colanta).
- **Costo por kilo ganado:** (costos de los centros Cría y levante y Ceba + la parte de los
  gastos generales sin centro —administración, arriendos, trabajadores, alquiler de finca—
  según los animales-día de sus lotes) / kilos ganados en el período.
- **Costo por animal/día:** costos del período / (animales × días).
- **Litros por vaca/día** y **litros por hectárea**.
- **Carga animal:** unidades gran ganado (UGG = 450 kg de peso vivo) por hectárea.
- **Rentabilidad:** utilidad del período / ingresos del período (como el informe de Colanta).
