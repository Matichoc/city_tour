# Financiamiento, dimensionamiento y herramientas — City Tour Papudo

> Todas las cifras son **estimaciones de trabajo** para decidir, no cotizaciones.
> Los precios de las herramientas cambian: verificar en cada sitio antes de
> contratar. Tipo de cambio supuesto: **1 USD ≈ 950 CLP**. Lo que depende de
> acuerdos con la municipalidad está marcado como _supuesto_.

## 1. Premisas dadas

- Papudo recibe **≥ 500.000 turistas** en temporada alta.
- Meta: que **10 %** (50.000 personas) use la plataforma, y luego escalar.

Definiciones que conviene fijar desde ya (si no, la meta no se puede medir):

| Término               | Definición propuesta                                         |
| --------------------- | ------------------------------------------------------------ |
| Usuario               | Visitante único con ≥ 1 sesión en la temporada               |
| Usuario activo        | ≥ 3 vistas de ficha o 1 itinerario/ruta abierta              |
| Instalación PWA       | App agregada a pantalla de inicio (rango típico 2–5 % de usuarios, o sea ~1.000–2.500) |
| Contacto generado     | Clic a llamar / navegar / sitio web de un negocio            |

Meta de producto más útil que "50.000 usuarios": **contactos generados a
negocios locales por temporada**, porque es lo que se le puede mostrar a la
Cámara de Comercio y a la municipalidad.

## 2. Dimensionamiento de carga (supuestos)

| Variable                              | Valor supuesto        |
| ------------------------------------- | --------------------- |
| Usuarios en temporada (≈ 12 semanas)  | 50.000                |
| Sesiones por usuario                  | 3                     |
| Páginas vistas por sesión             | 8                     |
| **Páginas vistas totales**            | **≈ 1,2 millones**    |
| Día pico (≈ 3 % de la temporada)      | ≈ 36.000 vistas       |
| Hora pico (≈ 12 % del día)            | ≈ 4.300 vistas/h → **~1,2 solicitudes de página/seg** |
| Peso medio por página (imágenes optimizadas, WebP) | 600 KB   |
| **Transferencia total**               | **≈ 700 GB** (≈ 250 GB si el CDN cachea bien) |

Conclusión: **la carga no es un problema técnico.** Una arquitectura estática
con caché (Next.js en CDN + Postgres administrado) la resiste con holgura. Los
riesgos reales son otros:

1. **Conectividad móvil débil** en playas y accesos → PWA, caché y modo offline.
2. **Costo de mapas** si se usa un proveedor que cobra por vista de mapa.
3. **Costo de imágenes** (ancho de banda) si no se optimizan.
4. **Mantener el contenido vivo** (es el costo más alto y el menos visible).
5. **Picos de fin de semana largo / Año Nuevo**: se resuelven con caché y páginas estáticas regeneradas.

Reglas para no escalar costos con la audiencia:

- Visitantes **sin cuenta**: itinerarios por token público, **no usar Supabase Auth anónimo** (cada sesión anónima cuenta como usuario activo mensual y empuja de plan).
- Mapas con **PMTiles autoalojados** (Protomaps) en almacenamiento de objetos con CDN; sin cobro por vista.
- Fotos propias optimizadas con CDN; **no Google Places Photos en producción** (cobra por solicitud).
- Páginas públicas con ISR/caché; la base solo se consulta al regenerar.
- IA apagada por defecto en el MVP.

## 3. Herramientas reales que necesitas

### 3.1 Obligatorias (MVP)

| Necesidad                 | Herramienta propuesta                    | Costo aprox. (USD/mes) | Nota |
| ------------------------- | ---------------------------------------- | ---------------------- | ---- |
| Repositorio + CI          | GitHub (plan gratuito)                   | 0                      | Ramas `main`/`develop`/trabajo, Actions |
| Hosting web               | Vercel Pro (o Cloudflare Pages/Workers)  | 20 + uso (0–60)        | El plan gratuito Hobby no permite uso comercial |
| Base de datos + Auth + Storage | Supabase Pro                        | 25 (+ 0–25 en temporada) | Proyecto separado para dev y prod |
| Mapas                     | MapLibre + Protomaps (PMTiles) en Cloudflare R2 | 0–5             | Alternativa: MapTiler (~25–300) |
| CDN, DNS, protección      | Cloudflare (gratis)                      | 0                      | WAF básico, caché |
| Dominio                   | `.cl` en NIC Chile                       | ≈ 1 (≈ 10–15/año)      | Idealmente a nombre de la municipalidad |
| Monitoreo de errores      | Sentry (gratis → Team)                   | 0–26                   | |
| Analítica sin cookies     | Plausible o Umami autoalojado            | 0–19                   | Cumple privacidad sin banner |
| Correo transaccional      | Resend o similar                         | 0–20                   | Invitaciones/avisos al personal |
| Backups                   | Supabase PITR o dump diario a R2         | 0–25                   | Documentar restauración |
| **Subtotal infraestructura** |                                       | **≈ 70–150 en el año; ≈ 130–280 en temporada alta** | |

### 3.2 Desarrollo

| Herramienta                 | Uso                                  | Costo aprox. (USD/mes) |
| --------------------------- | ------------------------------------ | ---------------------- |
| Claude Code (plan Pro/Max)  | Desarrollo asistido                  | 20–100                 |
| Supabase CLI, pnpm, Playwright | Migraciones, pruebas              | 0                      |
| Figma (opcional)            | Prototipos                           | 0–15                   |
| Dispositivos de prueba Android | Pruebas reales en terreno         | única vez ≈ 150–250    |

### 3.3 Cuando haya tracción (no ahora)

- IA para traducción/resumen: presupuesto tope mensual, modelo pequeño (ver `PLAN.md` §8). Orden de magnitud: **< 20 USD/mes** para traducir ~300 fichas.
- Envío de correos/avisos masivos a socios de la Cámara.
- Pasarela de pago (Transbank/Flow/Mercado Pago) solo si hay cobro a negocios.
- Soporte (mesa de ayuda) y contrato de mantenimiento.

## 4. Presupuesto

### 4.1 Costos de operación anual (infraestructura)

| Escenario | Supuesto | USD/año | CLP/año |
| --------- | -------- | ------- | ------- |
| Piloto    | Sin Vercel pago extra, 1 proyecto Supabase | ~ 900 | ~ 0,9 M |
| Temporada completa (50.000 usuarios) | 4 meses con carga alta | ~ 1.800–2.800 | ~ 1,7–2,7 M |
| Escalado (150.000+ usuarios, varias comunas) | Supabase Team/compute mayor, mapas dedicados | ~ 6.000–10.000 | ~ 6–10 M |

### 4.2 Costo humano (el principal)

El software es barato; **mantener la información** es lo caro. Dimensionar:

| Rol                                    | Dedicación               | Costo mensual aprox. (CLP) |
| -------------------------------------- | ------------------------ | -------------------------- |
| Coordinador/a de contenido (en municipalidad o contratado) | 20 h/sem | 500.000–800.000 |
| Verificación en terreno (temporada)    | 10 h/sem × 3 meses       | 250.000–400.000            |
| Fotografía/video (única vez + temporada) | ~ 30 sesiones          | 1.500.000–3.000.000 total  |
| Soporte técnico / mantención           | 8–10 h/mes               | 300.000–600.000            |
| Desarrollo inicial (si se externaliza) | 8–12 semanas             | 6–15 M total _(ver 4.3)_   |

### 4.3 Costo de construcción

- **Si lo construyes tú con Claude Code**: costo en dinero casi cero (≈ herramientas), costo en tiempo ≈ 8–10 semanas parciales (ver fases en `PLAN.md`).
- **Si se contrata a un tercero**: rango referencial 6–15 M CLP según alcance (MVP con panel + sitio público + PWA). Úsalo como referencia para que la propuesta a la municipalidad no quede subvalorada.

### 4.4 Resumen del primer año (MVP + 1 temporada)

| Ítem                           | CLP aprox.        |
| ------------------------------ | ----------------- |
| Infraestructura y herramientas | 2–3 M             |
| Contenido, verificación, fotos | 4–7 M             |
| Soporte                        | 2–4 M             |
| Construcción (si se externaliza) | 6–15 M          |
| **Total sin construcción**     | **≈ 8–14 M**      |
| **Total con construcción externa** | **≈ 14–29 M** |

## 5. Cómo financiarlo

Orden recomendado: primero lo que **no compromete a nadie a largo plazo**, después contratos recurrentes.

### 5.1 Fuentes públicas (a verificar bases y fechas vigentes)

| Fuente | Qué podría cubrir | Observación |
| ------ | ----------------- | ----------- |
| Presupuesto municipal / Compra Ágil (Mercado Público) | Licencia o servicio anual | Hay montos máximos para compras directas; **confirmar el tope vigente (UTM)** con la municipalidad. Un contrato por etapas permite partir sin licitación larga. |
| Gobierno Regional de Valparaíso (FNDR, FRIL, concursos de innovación/turismo) | Desarrollo + contenido | Proyectos de mayor monto y plazo; suele requerir que lo postule la municipalidad. |
| Sernatur (programas de turismo municipal, concurso "Más Valor Turístico") | Información, accesibilidad, personalización | El radar menciona proyectos ganadores de 2026 en esta línea; revisar bases. |
| Corfo (líneas de innovación y digitalización) | Desarrollo tecnológico, piloto | Aplica a empresa/persona jurídica ejecutora. |
| SUBDERE (PMU y similares) | Más bien infraestructura; poco probable para software | Consultar con SECPLAN. |

### 5.2 Fuentes privadas y locales

| Fuente | Modelo | Supuesto |
| ------ | ------ | -------- |
| **Cámara de Comercio de Papudo** | Cuota por socio destacada en la guía | _Supuesto:_ 40 socios × 15.000 CLP/mes |
| Alojamientos y restaurantes | Plan "ficha destacada" (fotos, eventos, estadísticas) | _Supuesto:_ 60 negocios × 10.000–20.000 CLP/mes en temporada |
| Auspiciadores territoriales (bancos, retail, servicentros, inmobiliarias) | Patrocinio por temporada | _Supuesto:_ 2–4 auspiciadores × 500.000–1.500.000 CLP |
| Operadores turísticos | Comisión por contacto/reserva (solo cuando existan reservas) | Fuera del MVP |
| Concursos privados / fundaciones | Subsidio puntual | Oportunista |

Regla ética para no romper la confianza: **lo pagado se marca como "destacado"**,
nunca altera horarios, fuentes ni el orden de los recorridos, y la información
básica de cada negocio es gratis.

### 5.3 Escenarios de ingreso (ilustrativos)

| Escenario  | Municipalidad | Cámara + negocios | Auspicios | Total anual (CLP) |
| ---------- | ------------- | ----------------- | --------- | ----------------- |
| Conservador | 3 M (convenio) | 2 M | 1 M | **≈ 6 M** |
| Base       | 6 M (licencia anual) | 6 M | 3 M | **≈ 15 M** |
| Optimista  | 9 M | 12 M | 6 M | **≈ 27 M** |

Lectura honesta: el escenario conservador cubre infraestructura y parte del
contenido, **no** la construcción externa. Para cubrir construcción hace falta
un fondo público (GORE/Sernatur/Corfo) o un contrato municipal inicial mayor.
Los usuarios finales **no pagan**; el valor se monetiza vía negocios y municipalidad.

### 5.4 Ruta de financiamiento sugerida

1. **Mes 0–2 (sin dinero externo):** construir MVP con ~15 fichas reales, mostrar demo a la municipalidad y la Cámara.
2. **Mes 2–4:** convenio piloto pequeño (compra directa) para cargar contenido y operar la temporada.
3. **Temporada alta:** medir contactos generados, usuarios únicos y negocios que reciben tráfico.
4. **Post-temporada:** con cifras reales, postular a fondo regional/Sernatur/Corfo y proponer licencia anual + plan de socios.
5. **Año 2:** escalar a otras comunas de la provincia (Zapallar, La Ligua…) reutilizando el producto.

## 6. Métricas para justificar la inversión

| Métrica | Meta temporada 1 |
| ------- | ---------------- |
| Usuarios únicos | 10.000 (piloto) → 50.000 (meta anual) |
| Itinerarios generados | 8 % de usuarios |
| Contactos generados a negocios | ≥ 20.000 |
| Negocios con ficha verificada | ≥ 80 |
| Fichas con verificación < 90 días | ≥ 80 % |
| Costo de infraestructura por usuario | < 0,05 USD |

## 7. Riesgos financieros

| Riesgo | Mitigación |
| ------ | ---------- |
| Depender de un único cliente (municipalidad) | Cámara + auspicios desde el primer año |
| Cambios políticos / de administración | Contrato por etapas, datos exportables, dominio y cuentas a nombre de la institución |
| Costos que escalan con la audiencia | Reglas de la sección 2 (sin auth anónima, PMTiles, caché, IA apagada) |
| Subestimar el costo de contenido | Presupuestar coordinador/a de contenido desde el día 1 |
| Meta de 10 % no se cumple | Medir por contactos a negocios, no solo por usuarios; difusión con QR en playas, alojamientos y paraderos |
| Fondos concursables lentos | No depender de ellos para operar la primera temporada |
