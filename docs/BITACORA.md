# Bitácora de avances

> Generada con `pnpm bitacora` desde el historial de git y las notas de
> [`bitacora-notas.json`](bitacora-notas.json). **No se edita a mano**: se
> cambian las notas y se vuelve a generar. Horas en hora de Chile.

**Cómo se numeran las versiones.** Cada entrega a `develop` (un PR fusionado)
es una versión `v0.N`, en orden de fusión. Mientras el proyecto sea un piloto
va en `v0.x`; `v1.0` será la primera publicación en `main` para el público.
Las migraciones de base de datos que hay que correr a mano en Supabase van
indicadas en cada versión.

**Cómo se actualiza.** Al cerrar cada entrega: agregar su nota en
`docs/bitacora-notas.json` (clave `actual`, y el número de PR cuando exista),
correr `pnpm bitacora` y subir el cambio en el mismo PR.

## Avance por día

La «ventana» va del primer al último registro del día (no son horas
trabajadas: hay pausas y trabajo sin registrar).

| Día | Ventana de actividad | Registros | Versiones entregadas |
| --- | --- | ---: | --- |
| Sábado, 17 de octubre de 2026 | 00:01 – 16:11 | 22 | v0.16, v0.17, v0.18, v0.19, v0.20, v0.21, v0.22, v0.23 |
| Viernes, 16 de octubre de 2026 | 00:04 – 23:51 | 15 | v0.9, v0.10, v0.11, v0.12, v0.13, v0.14, v0.15 |
| Jueves, 15 de octubre de 2026 | 00:05 – 23:52 | 10 | v0.7, v0.8 |
| Miércoles, 14 de octubre de 2026 | 23:50 – 23:50 | 1 | — |
| Martes, 13 de octubre de 2026 | 00:10 – 00:58 | 4 | v0.5, v0.6 |
| Lunes, 12 de octubre de 2026 | 15:43 – 17:53 | 10 | v0.1, v0.2, v0.3, v0.4 |

## Versiones

### v0.23 — Seguridad: Next.js 16.3.8
Sábado, 17 de octubre de 2026, 16:29 · [PR #27](https://github.com/Matichoc/city_tour/pull/27)

Actualiza Next.js y eslint-config-next de 16.3.5 a 16.3.8 para cerrar los 7 avisos de seguridad de Next (hallazgo DEP-01 de la auditoría). Sin cambios de funcionalidad.

Registros:

- 10-17 16:10 — Seguridad (DEP-01): actualiza Next.js y eslint-config-next a 16.3.8 (`bbd3831`)
- 10-17 16:11 — Bitácora: número de PR de DEP-01 (27) (`eec5bcb`)

### v0.22 — Galería de la ficha con flechas
Sábado, 17 de octubre de 2026, 03:15 · [PR #25](https://github.com/Matichoc/city_tour/pull/25)

La galería de fotos del local muestra una imagen a la vez con flechas a los lados, contador y deslizado con el dedo, sin la barra de desplazamiento.

Registros:

- 10-17 03:09 — Ficha del comercio: galería con flechas a los lados, contador y deslizado (`84a2a10`)
- 10-17 03:11 — Galería de la ficha: vuelve a mostrar varias fotos y deja solo las flechas a los lados (`c5b564c`)

### v0.21 — Plan de idiomas originarios (mapudungun y rapa nui)
Sábado, 17 de octubre de 2026, 03:05 · [PR #24](https://github.com/Matichoc/city_tour/pull/24)

Plan y planilla de 99 textos para que una persona hablante traduzca; sin código ni traducciones automáticas.

Registros:

- 10-17 03:02 — Plan de idiomas originarios (mapudungun y rapa nui) y planilla de textos a traducir (`eb06918`)

### v0.20 — Fuente «validada por el representante», videos y edición completa por local
Sábado, 17 de octubre de 2026, 02:58 · [PR #23](https://github.com/Matichoc/city_tour/pull/23)

La ficha muestra «Validada por el representante del local» en vez de hablar del formulario; cada local se edita completo desde el panel (datos, horarios por temporada, logo, carta, fotos, promociones y videos, con orden, texto y crédito); videos de hasta 50 MB subidos directo a Storage. Accesos a «Nuevo comercio», «Importar planilla» y «Editar ficha, fotos y videos» también desde Fichas → Lugares.

**Migraciones en Supabase:** 0024

Registros:

- 10-17 02:43 — Comercios: fuente «validada por el representante», videos y edición completa por local (`8c2ac7d`)
- 10-17 02:44 — Bitácora: enlaza la entrega en curso con su PR (`385d3be`)
- 10-17 02:53 — Panel: «Nuevo comercio», «Importar planilla» y «Editar ficha, fotos y videos» desde Fichas (`9520934`)

### v0.19 — Panel de comercios: crear, fotos, importar la planilla y bitácora
Sábado, 17 de octubre de 2026, 02:13 · [PR #22](https://github.com/Matichoc/city_tour/pull/22)

Crear y editar comercios y subir su logo, carta y fotos desde el panel; importar la planilla del formulario (Google Sheets o CSV) cargando solo lo nuevo o lo que cambió; contacto interno privado; las fichas editadas en el panel ya no las pisa content.sql; bitácora de avances.

**Migraciones en Supabase:** 0023

Registros:

- 10-17 02:09 — Panel: crear comercios, subir fotos, importar la planilla y bitácora de avances (`637bf68`)
- 10-17 02:10 — Bitácora: la entrega en curso se une sola con su PR al fusionarse (`d0c307e`)

### v0.18 — La portada es la imagen real del local
Sábado, 17 de octubre de 2026, 01:49 · [PR #21](https://github.com/Matichoc/city_tour/pull/21)

Si el local tiene foto o logo, esa es la portada; la ilustración con IA queda solo para los lugares sin imágenes.

Registros:

- 10-17 01:47 — Fichas: la portada es la imagen real del local; la ilustración con IA solo si no hay (`72549b4`)

### v0.17 — Fotos y videos en comentarios; Roots Salinas completo; paleta del logo
Sábado, 17 de octubre de 2026, 01:36 · [PR #20](https://github.com/Matichoc/city_tour/pull/20)

Fotos y videos con detector gratuito en el navegador y revisión del personal; horarios por temporada, Instagram, logo, carta, promociones y registro SERNATUR de Roots Salinas; el sitio usa los colores del logo en versión pálida.

**Migraciones en Supabase:** 0020, 0021, 0022

Registros:

- 10-17 01:03 — Comentarios: fotos y videos con filtro de contenido y revisión en el panel (`e3e39d7`)
- 10-17 01:15 — Diseño: paleta del sitio desde los colores del logo municipal, en versión pálida (`dc73aee`)
- 10-17 01:15 — Comercios: Roots Salinas con los datos de su formulario; horarios por temporada (`51e8b54`)
- 10-17 01:32 — Roots Salinas: logo, carta, promociones y registro SERNATUR (`2d19520`)

### v0.16 — Comentarios reales, comercios y datos al día
Sábado, 17 de octubre de 2026, 00:48 · [PR #19](https://github.com/Matichoc/city_tour/pull/19)

Comentarios que se publican al enviarse y se moderan en el panel; botón de acción, avisos e invitación para comercios; recordatorio de actualizar datos cada 6 meses; localidades y vista previa en el panel; colores de referencia del logo.

**Migraciones en Supabase:** 0017, 0018, 0019

Registros:

- 10-17 00:01 — Docs: referencia de colores de la municipalidad (provisoria) (`e35348a`)
- 10-17 00:17 — Comentarios reales: se publican al enviarse y se moderan en /admin (`8230fa9`)
- 10-17 00:26 — Comercios: botón de acción, avisos destacados e invitación a sumarse (`0c64893`)
- 10-17 00:35 — Comercios: recordatorio para actualizar los datos cada 6 meses (`94141dc`)
- 10-17 00:39 — Panel: pestaña de localidades y vista previa de cada ficha (`83a9cab`)

### v0.15 — Panel /admin: ver y verificar
Viernes, 16 de octubre de 2026, 23:55 · [PR #18](https://github.com/Matichoc/city_tour/pull/18)

develop pasa a ser producción cerrada hasta el financiamiento. Panel con ingreso por correo para ver y verificar lugares, eventos y rutas.

Registros:

- 10-16 23:16 — Docs: develop es producción (cerrada) hasta el financiamiento (`cc7d5d5`)
- 10-16 23:22 — Guía: clave del equipo en Production y la del demo en Preview (`ba9784f`)
- 10-16 23:51 — Panel /admin: ingresar, ver y verificar lugares, eventos y rutas (`813b509`)

### v0.14 — Ambientes main, develop y demo
Viernes, 16 de octubre de 2026, 23:09 · [PR #16](https://github.com/Matichoc/city_tour/pull/16)

Ambientes con enlace permanente para el equipo y enlaces temporales para compartir (hasta 30 días), con direcciones sin el nombre de la IA ni de la nube.

Registros:

- 10-16 22:55 — Ambientes main/develop/demo y enlaces de hasta 30 días (`362517d`)
- 10-16 23:02 — Enlace permanente para el equipo y guía con dominio propio (`1e720a2`)
- 10-16 23:03 — Guía: direcciones vercel.app y clave propia del demo para abrirlo y cerrarlo (`8b12d89`)

### v0.13 — Enlaces para compartir que vencen solos
Viernes, 16 de octubre de 2026, 22:32 · [PR #15](https://github.com/Matichoc/city_tour/pull/15)

Vistas previas cerradas y enlaces firmados con duración en horas o días.

Registros:

- 10-16 22:28 — Vistas previas: enlaces para compartir que vencen solos (`f51e516`)

### v0.12 — Sitio conectado a la base de datos
Viernes, 16 de octubre de 2026, 22:09 · [PR #14](https://github.com/Matichoc/city_tour/pull/14)

El sitio lee lugares, eventos, rutas y localidades de Supabase y vuelve al contenido del repo si falla. Contenido cargable con supabase/content.sql.

**Migraciones en Supabase:** 0016

Registros:

- 10-16 21:13 — Base de datos: contenido del sitio en Supabase, con respaldo en el repo (`5731ac2`)

### v0.11 — Formulario para comercios y revisión legal
Viernes, 16 de octubre de 2026, 18:36 · [PR #12](https://github.com/Matichoc/city_tour/pull/12)

Formulario «Suma tu comercio» (Google Forms), con envío de fotos por WhatsApp, y lista de revisión legal.

Registros:

- 10-16 18:02 — Docs: formulario para comercios y lista de revisión legal (`5bfc8c8`)
- 10-16 18:15 — Formulario corto para comercios con script de Google Apps Script (`f6e65e4`)
- 10-16 18:31 — Formulario: número y enlace de WhatsApp para mandar las fotos (`7ac9ebb`)
- 10-16 18:32 — Formulario: enlace de WhatsApp corto (`a642c1a`)

### v0.10 — Cámara a pie y documentos del PLADETUR
Viernes, 16 de octubre de 2026, 00:20 · [PR #10](https://github.com/Matichoc/city_tour/pull/10)

Figura guía a elegir (flecha, mano, huellas, gaviota o velero) y alineación del producto y del precio con el plan.

Registros:

- 10-15 22:36 — docs: alineación del producto y del precio con el PLADETUR de Papudo (`198dd8c`)
- 10-16 00:16 — Cámara a pie: elegir la figura guía (flecha, dedo, huellas, gaviota o velero) (`b707e22`)
- 10-16 00:19 — Cámara a pie: el dedo pasa a ser una mano de dibujos animados (`4b549f1`)
- 10-16 00:19 — Merge remote-tracking branch 'origin/claude/optimistic-dirac-ltwsud' into claude/optimistic-dirac-ltwsud (`c6de9cb`)

### v0.9 — Alineación con el PLADETUR
Viernes, 16 de octubre de 2026, 00:10 · [PR #11](https://github.com/Matichoc/city_tour/pull/11)

Categorías según los productos del plan, agenda anual de eventos y modo quiosco para las oficinas de información.

Registros:

- 10-15 22:49 — feat: categorías alineadas con los seis productos del PLADETUR (`d86ea8e`)
- 10-15 22:51 — feat: agenda anual de eventos (PLADETUR B2.4) (`5ca7d12`)
- 10-15 22:55 — feat: modo quiosco para las oficinas de información (PLADETUR A1.6) (`00ec999`)
- 10-15 23:00 — feat: portugués, QR por hito y ruta imprimible (PLADETUR A1.3, B2.2) (`212b386`)
- 10-15 23:36 — feat: estilo con onda de Papudo, contenido de ejemplo con opiniones y agenda tipo cartelera (`f7bce1f`)
- 10-15 23:52 — Selector de idioma en menú, Explorar con filtros desplegables, Eventos en la barra móvil, tarjetas más chicas en web y 14 ilustraciones IA nuevas (`856cdbc`)
- 10-16 00:04 — Explorar agrupado por categoría en desplegables y bloque de autor en Información (`c1b6a3a`)

### v0.8 — Ajuste de la cámara del recorrido
Jueves, 15 de octubre de 2026, 00:36 · [PR #9](https://github.com/Matichoc/city_tour/pull/9)

La cámara también se ofrece lejos de la parada.

Registros:

- 10-15 00:33 — fix: la cámara del recorrido en vivo también se ofrece lejos de la parada y sugiere la más cercana (`864ded9`)

### v0.7 — Mapa 3D, recorrido en vivo y cámara
Jueves, 15 de octubre de 2026, 00:23 · [PR #8](https://github.com/Matichoc/city_tour/pull/8)

Mapa 3D de la comuna, recorrido en vivo (con modo demostración), guía con cámara y opiniones en la ficha.

Registros:

- 10-14 23:50 — feat: mapa 3D de la comuna, recorrido en vivo, guía con cámara y ficha con opiniones (`56bb13c`)
- 10-15 00:05 — feat: modo demostración del recorrido en vivo con ubicación simulada (`4f7df57`)

### v0.6 — Roots Salinas, primera ficha de comercio
Martes, 13 de octubre de 2026, 01:00 · [PR #7](https://github.com/Matichoc/city_tour/pull/7)

Primer local real de la guía, ubicado con su Plus Code.

Registros:

- 10-13 00:56 — feat: agrega Roots Salinas (local de comida en Las Salinas de Pullally) (`9272faf`)
- 10-13 00:58 — feat: ubica Roots Salinas con su Plus Code (HHMQ+F7) (`b867aee`)

### v0.5 — QA y mejoras para la municipalidad
Martes, 13 de octubre de 2026, 00:40 · [PR #6](https://github.com/Matichoc/city_tour/pull/6)

Correcciones, página para negocios, QR para locales, analítica sin cookies y SEO; contenido validado en la web.

Registros:

- 10-13 00:10 — QA y mejoras para la municipalidad: correcciones, negocios, QR, analítica y SEO (`2018cf2`)
- 10-13 00:38 — Contenido validado en la web: corregir Santuario, contacto con fuente y sumar lugares y locales (`7d37c63`)

### v0.4 — Contenido y funciones de la guía
Lunes, 12 de octubre de 2026, 17:54 · [PR #5](https://github.com/Matichoc/city_tour/pull/5)

Lugares, pueblos y la ruta costera de Papudo, mapa, tema de playa y campo, y datos de contacto con su fuente.

Registros:

- 10-12 17:32 — Portar contenido y funciones de directorio_turistico a Papudo, con nuevo tema de playa y campo (`a9fdf3c`)
- 10-12 17:38 — Completar datos de Papudo: páginas de pueblos, correo de contacto y auspicio de Matichoc (`a62378b`)
- 10-12 17:40 — Matichoc más sutil: crédito 'Desarrollado por' al pie en vez del banner (`24d5c0b`)
- 10-12 17:48 — Conectar la portada ilustrada de la ruta costera (tarjetas, hero, imagen para compartir) (`c27aa59`)
- 10-12 17:48 — Rótulo de ilustración IA más discreto (`b036d47`)
- 10-12 17:53 — Conectar las ilustraciones de humedal, paseo, plaza, hostales y playa (`c3df6fd`)

### v0.3 — Fase 1: base de datos
Lunes, 12 de octubre de 2026, 17:14 · [PR #3](https://github.com/Matichoc/city_tour/pull/3)

Migraciones 0001–0015, permisos por rol (RLS), datos iniciales y pruebas de base de datos.

**Migraciones en Supabase:** 0001–0015

Registros:

- 10-12 16:56 — Fase 1: migraciones, RLS por rol, seed y pruebas de base de datos (`e348917`)

### v0.2 — Fase 0: esqueleto del sitio
Lunes, 12 de octubre de 2026, 16:33 · [PR #2](https://github.com/Matichoc/city_tour/pull/2)

Next.js 16, textos en español e inglés y un primer sitio de demostración de Papudo.

Registros:

- 10-12 16:31 — Fase 0: esqueleto Next.js 16, i18n es/en y sitio de demostración de Papudo (`633a1c4`)

### v0.1 — Plan de trabajo y flujo de ramas
Lunes, 12 de octubre de 2026, 16:20 · [PR #1](https://github.com/Matichoc/city_tour/pull/1)

Plan del proyecto, financiamiento y herramientas, y el flujo de ramas.

Registros:

- 10-12 15:51 — Agregar flujo de ramas, financiamiento y dimensionamiento (`0e786b2`)

---

Primer registro del proyecto: Lunes, 12 de octubre de 2026, 15:43.
