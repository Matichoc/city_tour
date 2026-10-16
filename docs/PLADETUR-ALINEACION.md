# Alineación con el PLADETUR de Papudo

Fuente: _Informe Final — Elaboración Plan de Desarrollo Turístico de la comuna
de Papudo (licitación 3596-19-LE22)_, iD actitud e impacto para la I.
Municipalidad de Papudo, junio de 2023. Archivo en
`docs/investigacion/iD - Informe Final - PLADETUR Papudo (1).pdf`. El plan se
llama **«Mejor destino, mejor turismo»** y cubre **2023–2027**. Las páginas
citadas son las impresas en el informe.

> Los montos del plan son estimaciones de junio de 2023 para todo el período
> 2023–2027 (no son anuales). Falta confirmar con el municipio qué partidas se
> asignaron y ejecutaron. Nada de este documento es una cotización.

## 1. Lo que dice el plan y nos importa

**Visión (p. 130).** Papudo como un balneario a escala humana que une el casco
histórico, **Pullally y Las Salinas en un solo destino turístico
responsable**. Quienes participaron no quieren un destino colapsado, de loteos
irregulares ni con turistas irrespetuosos (p. 129).

**Posicionamiento (p. 131).** Cuatro rasgos de diferenciación: _familias,
tranquilidad, naturaleza, patrimonio y vida sana_. Mensaje permanente:
«Papudo… disfrute familiar». Competidores citados: Maitencillo, Zapallar, Santo
Domingo y Pichidangui.

**Mercados (p. 136).** De proximidad: Región Metropolitana, Gran Valparaíso,
Valle del Aconcagua, La Serena–Coquimbo, resto de Chile y provincia de Mendoza.
Viajeros en familia.

**Seis productos (p. 136):** balneario, recreación, deportes, cultura y
patrimonio, gastronomía y ruralidad.

**Metas cuantitativas (p. 134).** Entre otras: desestacionalizar las llegadas;
al menos 60 % de público familiar; gasto turístico +10 % real interanual;
ventas de los negocios turísticos +10 % real; al menos 80 % de percepción
positiva de los visitantes y 65 % de la comunidad; encuestas a visitantes en
marzo y julio; medir y acortar la informalidad de la oferta.

**Diagnóstico que justifica la app (cap. 3.4, p. 94 y siguientes).**

- «La presencia en la difusión turística en páginas institucionales es,
  prácticamente, inexistente» (p. 95); la sección de turismo del sitio
  municipal no estaba operativa en 2023.
- Escaso aprovechamiento de plataformas digitales de comercialización.
- Alta presencia en Airbnb (más de 700 alojamientos enteros en la zona núcleo,
  p. 93) y baja en Tripadvisor y Booking.
- Debilidades de la síntesis FODA (p. 112): oferta informal, congestión
  estival, falta de gobernanza turística y de actividades para la familia.

## 2. Dónde encaja la app

Montos y páginas del plan (suma del plan operativo $852 M, p. 144; del plan de
marketing $217,5 M, p. 166).

| Proyecto del PLADETUR | Monto | Qué aporta la app | Estado hoy |
| --- | --- | --- | --- |
| B2.3 Plataforma web y redes sociales (**urgente**, p. 175) | $25 M | Sitio y app móvil: territorio, experiencias, mapas, eventos, mobile-first y buscable en Google | Sitio de prueba en línea |
| B2.4 Agenda anual de eventos (p. 176) | $2 M | Calendario revisado cada trimestre, publicado en web y por QR | Modelo de datos listo, sin página |
| B3.2 Bases de datos y boletines (**clave**, p. 178) | $2,5 M | Registro de prestadores y boletín | Modelo de datos listo, sin panel |
| A4.2 Monitoreo del turismo (p. 160) | $5 M | Analítica anónima y encuesta breve de satisfacción | Analítica sin cookies activa |
| A1.6 Oficinas de información (**clave**, p. 150) | $30 M | Modo quiosco en tablet para las oficinas, con atención por WhatsApp | No existe |
| A1.3 Señalética turística (**clave**, p. 147) | $30 M | QR en cada hito que abre su ficha | Afiche QR por comercio |
| B2.2 Mapas y folletería (**clave**, p. 174) | $20 M | Mapa y folleto digital imprimible | Mapa 3D y rutas; sin folleto |
| A2.1 Fomento, formalización y asociatividad (**urgente**, p. 151) | $100 M | Registro y verificación de prestadores (apoyo, no el proyecto completo) | Verificación en la base |

Partidas directamente digitales (B2.3 + B2.4 + B3.2 + A4.2): **$34,5 M**. Con el
banco de imágenes (B2.1, $25 M) para fotos y contenido: $59,5 M.

## 3. Ajustes propuestos al sitio

Ordenados por cercanía con lo que el plan pide:

1. **Categorías = productos del plan.** Pasar de playas, naturaleza,
   patrimonio, gastronomía, alojamiento y actividades a balneario, recreación,
   deportes, cultura y patrimonio, gastronomía y ruralidad (alojamiento queda
   como servicio). Hay que cargar contenido con fuente para las categorías hoy
   vacías.
2. **Agenda anual de eventos** (`/eventos`), con fuentes y sin inventar fechas.
3. **Idiomas:** el plan pide material en español, inglés y portugués (p. 174 y
   150). Hoy hay español e inglés.
4. **Modo quiosco** para tablet en las oficinas de información (Costa y
   Pullally), con los mismos contenidos y QR de continuación en el celular.
5. **Encuesta breve de satisfacción** (marzo y julio) y reporte para el Comité
   de Turismo, alineado con las metas de la p. 134.
6. **QR por hito** para la señalética y **mapa imprimible** de cada ruta.
7. **Mensaje y tono:** familias, tranquilidad, naturaleza, patrimonio y vida
   sana; presentar Papudo, Las Salinas y Pullally como un solo destino (ya está
   en la guía y en la portada).
8. **Código del visitante:** consejos de turismo responsable con fuente (el plan
   pide visitantes respetuosos y cuidado de la bahía).

## 4. Alineación del precio

Mapa de nuestros costos con las partidas del plan:

| Nuestro costo (docs/FINANCIAMIENTO.md) | Rango | Partida del PLADETUR |
| --- | --- | --- |
| Construcción de la plataforma | $6–15 M, una vez | B2.3 Plataforma web y redes ($25 M) |
| Infraestructura en la nube | $2–3 M al año | B2.3 (mantención «periódica» de la web, sin monto propio) |
| Contenido, verificación y fotos | $4–7 M al año | B2.1 Banco de imágenes ($25 M), B2.4 Agenda ($2 M) |
| Soporte y reportes | $2–4 M al año | A4.2 Monitoreo ($5 M), B3.2 Bases de datos y boletines ($2,5 M) |

- **Año 1** (construcción más operación, $14–29 M) cabe dentro de las partidas
  digitales del plan ($34,5 M) si estas siguen disponibles y sin comprometer.
- **Años 2 a 5:** el plan no presupuesta la mantención recurrente más allá de
  esos montos. La propuesta debe pedir que el municipio la proyecte (por ejemplo
  vía el presupuesto municipal o el Fondo Nacional de Desarrollo Regional, que
  el plan menciona para otros proyectos).
- **Cofinanciamiento mencionado en B2.3:** Sernatur y la Corporación Regional de
  Turismo como entes vinculados; fuente de financiamiento: municipal.
- **Modelo sugerido:** presentar la propuesta como «ejecución de los proyectos
  B2.3, B2.4, B3.2 y A4.2 del PLADETUR», con una cuota de implementación y un
  plan anual, y metas medibles tomadas de la p. 134.

## 5. Gobernanza (p. 185–188)

El plan crea un Comité Municipal de Turismo y comités de trabajo por programa,
con la Cámara de Comercio y Turismo, la Fundación Papudo Nativo, representantes
de Pullally, Sernatur y el Gobierno Regional, entre otros. En la app esto
equivale a: SuperAdmin (nosotros), municipio (editor y verificador), Cámara de
Comercio (editor de comercios) y dueños de local, más un reporte de uso para el
Comité.

## 6. Por validar

- Qué partidas del plan se asignaron o ejecutaron, y con qué fuente.
- Si el municipio ya tiene o planea un sitio de turismo propio (el plan sugiere
  un dominio tipo `papudo.travel`).
- Estado de la marca turística (B3.1, urgente) para usar su identidad en el
  sitio.
- Lista oficial de prestadores formales para el registro (A2.1, B3.2).
