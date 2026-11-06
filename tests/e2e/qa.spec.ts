import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const KEY = "papudo-en-tu-mano:trip:v1";

test("404 localizado en español con salida al inicio", async ({ page }) => {
  const res = await page.goto("/es/no-existe-esta-pagina");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("No encontramos esta página")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir al inicio" })).toBeVisible();
});

test("un enlace compartido no pisa el recorrido guardado sin preguntar", async ({
  page,
}) => {
  await page.goto("/es");
  await page.evaluate((k) => {
    localStorage.setItem(
      k,
      JSON.stringify({
        slugs: ["papudo-plaza"],
        start: null,
        returnToStart: false,
        startTime: "10:00",
        orderMode: "auto",
      }),
    );
  }, KEY);
  await page.goto("/es/recorrido?l=playa-papudo,playa-chica-papudo&h=11:00");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Te compartieron un recorrido" }),
  ).toBeVisible();
  const before = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).slugs,
    KEY,
  );
  expect(before).toEqual(["papudo-plaza"]);
  await page
    .getByRole("button", { name: "Cargar el recorrido compartido" })
    .click();
  const after = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!).slugs,
    KEY,
  );
  expect(after).toEqual(["playa-papudo", "playa-chica-papudo"]);
});

test("un enlace compartido se carga solo si no había recorrido", async ({
  page,
}) => {
  await page.goto("/es/recorrido?l=playa-papudo,papudo-plaza");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Cómo llegar" }),
  ).toHaveCount(2);
});

test("Para negocios no solicita datos: es una versión de prueba", async ({
  page,
}) => {
  await page.goto("/es/negocios");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Para negocios",
  );
  await expect(
    page.getByText(/las inscripciones de negocios todavía no están abiertas/),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Inscribir/ })).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
});

test("un local sin coordenada muestra dirección y 'Cómo llegar' por búsqueda", async ({
  page,
}) => {
  await page.goto("/es/lugares/hotel-carande");
  await expect(page.getByText("Chorrillos 89, Papudo").first()).toBeVisible();
  await expect(
    page
      .getByText("Comercio local")
      .or(page.getByText(/Ubicación exacta por confirmar/)),
  ).toBeVisible();
  const href = await page
    .getByRole("link", { name: "Cómo llegar" })
    .getAttribute("href");
  expect(href).toContain("google.com/maps/search");
  await expect(
    page.getByRole("button", { name: /(Agregar )?[Aa] mi recorrido/ }),
  ).toHaveCount(0);
});

test("el generador de QR crea un afiche con el origen del local", async ({
  page,
}) => {
  await page.goto("/es/qr?nombre=Hostal%20Las%20Gaviotas");
  await expect(page.locator("section svg")).toBeVisible();
  await expect(page.getByText(/\?origen=hostal-las-gaviotas/)).toBeVisible();
});

for (const path of [
  "/es",
  "/es/explorar",
  "/es/eventos",
  "/es/eventos/demo-noche-de-bandas",
  "/es/lugares/demo-cabalgatas-del-valle",
  "/es/quiosco",
  "/es/lugares/playa-papudo",
  "/es/rutas/papudo-a-pie",
  "/es/recorrido",
  "/es/informacion",
  "/es/como-usar",
  "/es/negocios",
  "/en",
  "/pt",
]) {
  test(`accesibilidad (axe, WCAG AA) sin fallas graves: ${path}`, async ({
    page,
  }) => {
    // Se mide el estado final, sin animaciones de entrada a medio camino.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      // El rótulo "Ilustración IA" es intencionalmente tenue y va sobre imágenes.
      .exclude("[data-ai-badge]")
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
      ),
    ).toEqual([]);
  });
}

test("el primer Tab ofrece saltar al contenido y lo enfoca", async ({
  page,
}) => {
  await page.goto("/es/lugares/playa-chica-papudo");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Saltar al contenido" });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#contenido")).toBeFocused();
});

/**
 * Audio falso: el servidor de «Escuchar» responde con un audio por parte y el
 * navegador «reproduce» cada uno en `ms` (registra qué sonó). También espía la
 * voz del dispositivo, que nunca debe usarse.
 */
async function fakeAudio(page: Page, ms = 150, status = 200) {
  await page.route("**/api/escuchar**", (route) => {
    const url = new URL(route.request().url());
    const n = url.searchParams.get("tipo") === "ruta" ? 4 : 1;
    return route.fulfill(
      status === 200
        ? {
            json: {
              sections: Array.from({ length: n }, (_, i) => ({
                url: `/audio-falso/${i}.mp3`,
              })),
            },
          }
        : { status, json: { error: "not-configured" } },
    );
  });
  await page.addInitScript((ms) => {
    const w = window as unknown as { __played: string[]; __robot: number };
    w.__played = [];
    w.__robot = 0;
    const timers = new WeakMap<HTMLMediaElement, number>();
    HTMLMediaElement.prototype.play = function () {
      w.__played.push(new URL(this.src).pathname);
      clearTimeout(timers.get(this));
      timers.set(
        this,
        window.setTimeout(() => this.dispatchEvent(new Event("ended")), ms),
      );
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      clearTimeout(timers.get(this));
    };
    if ("speechSynthesis" in window)
      window.speechSynthesis.speak = () => {
        w.__robot += 1;
      };
  }, ms);
}

const played = (page: Page) =>
  page.evaluate(() => (window as unknown as { __played: string[] }).__played);

test("Escuchar reproduce la ficha con voz natural, pausa y sigue", async ({
  page,
}) => {
  // Dos segundos por audio: alcanza a pausar antes de que termine.
  await fakeAudio(page, 2_000);
  const pedido = page.waitForRequest(/\/api\/escuchar\?/);
  await page.goto("/es/lugares/playa-chica-papudo");
  await page
    .getByRole("button", { name: /Escuchar la ficha de Playa Chica/ })
    .click();
  expect((await pedido).url()).toContain(
    "tipo=lugar&slug=playa-chica-papudo&locale=es",
  );
  await page.getByRole("button", { name: "Pausar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("button", { name: /Escuchar la ficha/ }),
  ).toBeVisible({ timeout: 15_000 });
  expect(await played(page)).toContain("/audio-falso/0.mp3");
  await expect(page.locator("#resumen [aria-live=polite]")).toHaveText(
    "Lectura terminada",
  );
});

test("sin audio natural disponible, avisa y nunca usa la voz del dispositivo", async ({
  page,
}) => {
  await fakeAudio(page, 150, 503);
  await page.goto("/es/lugares/playa-chica-papudo");
  await page
    .getByRole("button", { name: /Escuchar la ficha de Playa Chica/ })
    .click();
  await expect(
    page
      .getByText("El audio con voz natural todavía no está disponible.")
      .first(),
  ).toBeVisible();
  expect(await played(page)).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { __robot: number }).__robot,
    ),
  ).toBe(0);
});

test("audioguía de ruta: presenta la ruta, salta entre paradas y marca la que suena", async ({
  page,
}) => {
  // Audios lentos: no terminan solos mientras se prueba.
  await fakeAudio(page, 5_000);
  await page.goto("/es/rutas/ruta-costera-papudo");
  await page
    .getByRole("button", { name: /Escuchar la ruta .* como audioguía/ })
    .click();
  // La etiqueta visible de la parte en curso (el aviso sr-only repite el texto).
  const now = page.locator("p", { hasText: "♪" });
  await expect(now).toHaveText(/Presentación de la ruta/);
  await page
    .getByRole("button", { name: "Saltar a la parte siguiente" })
    .click();
  await expect(now).toHaveText(/Parada 1 de 3:/);
  await expect(page.locator("#parada-1")).toHaveAttribute(
    "aria-current",
    "step",
  );
  await page
    .getByRole("button", { name: "Saltar a la parte siguiente" })
    .click();
  await expect(page.locator("#parada-2")).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.locator("#parada-1")).not.toHaveAttribute("aria-current");
  await page.getByRole("button", { name: "Detener" }).click();
  await expect(page.locator("[aria-current=step]")).toHaveCount(0);
  expect(await played(page)).toEqual([
    "/audio-falso/0.mp3",
    "/audio-falso/1.mp3",
    "/audio-falso/2.mp3",
  ]);
});

test("ficha: una sola acción principal y el resto en íconos", async ({
  page,
}) => {
  await page.goto("/es/lugares/playa-chica-papudo");
  await expect(
    page.getByRole("heading", { name: "Playa Chica", level: 1 }),
  ).toBeVisible();
  // Sin botón de comercio, «Cómo llegar» es la acción principal (una vez).
  await expect(page.getByRole("link", { name: "Cómo llegar" })).toHaveCount(1);
  for (const name of ["Guardar", "A mi recorrido", "Compartir"]) {
    await expect(page.getByRole("button", { name })).toBeVisible();
  }
  // «Balneario en Papudo»: el pueblo enlaza a su página.
  await expect(
    page.getByRole("link", { name: "Papudo", exact: true }),
  ).toHaveAttribute("href", /\/es\/pueblos\//);
});

// Una página más ancha que la pantalla desplaza la vista en el celular y deja
// la barra inferior fuera de la pantalla (pasó en Rutas).
for (const path of [
  "/es",
  "/es/explorar",
  "/es/explorar?vista=mapa",
  "/es/lugares/playa-chica-papudo",
  "/es/rutas",
  "/es/rutas/ruta-costera-papudo",
  "/es/rutas/papudo-a-pie",
  "/es/eventos",
  "/es/informacion",
  "/es/como-usar",
  "/es/recorrido",
]) {
  test(`celular: ${path} no es más ancha que la pantalla`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { width, scroll } = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(scroll).toBeLessThanOrEqual(width);
  });
}

// Ruta Costera: Salinas de Pullally → Playa de Papudo → Playa Chica, por calles.
const STREET_PATH = {
  mode: "walk",
  distanceMeters: 9400,
  durationSeconds: 7500,
  coordinates: [
    [-71.4253, -32.4419],
    [-71.4301, -32.4602],
    [-71.4402, -32.4873],
    [-71.4486, -32.5052],
    [-71.4478, -32.5075],
  ],
};

test("ruta: el mapa traza el camino por calles (a pie o en auto), nunca una recta", async ({
  page,
}) => {
  const asked: URL[] = [];
  await page.route("**/api/ruta/paradas**", (route) => {
    const url = new URL(route.request().url());
    asked.push(url);
    return route.fulfill({
      json: { ...STREET_PATH, mode: url.searchParams.get("mode") },
    });
  });
  await page.goto("/es/rutas/ruta-costera-papudo");
  const status = page.getByTestId("route-status");
  await expect(status).toHaveText("9,4 km · 2 h 5 min");
  // Un solo camino que pasa por las tres paradas, en orden.
  expect(asked[0]!.searchParams.get("mode")).toBe("walk");
  expect(asked[0]!.searchParams.getAll("p")).toHaveLength(3);

  await page.getByRole("button", { name: "En auto" }).click();
  await expect(page.getByRole("button", { name: "En auto" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => asked.at(-1)?.searchParams.get("mode")).toBe("car");
});

test("ruta: si no se puede trazar por calles, avisa en vez de dibujar una recta", async ({
  page,
}) => {
  await page.route("**/api/ruta/paradas**", (route) =>
    route.fulfill({ status: 502, json: { error: "upstream" } }),
  );
  await page.goto("/es/rutas/ruta-costera-papudo");
  await expect(page.getByTestId("route-status")).toHaveText(
    "No pudimos trazar el camino por calle. Sigue el orden de los números.",
  );
});

test("ruta: «Enviar por WhatsApp» abre WhatsApp con las paradas y el enlace", async ({
  page,
}) => {
  await page.goto("/es/rutas/ruta-costera-papudo");
  const link = page.getByRole("link", { name: "Enviar por WhatsApp" });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect
    .poll(async () => (await link.getAttribute("href")) ?? "")
    .toContain(encodeURIComponent("/es/rutas/ruta-costera-papudo"));
  const href = new URL((await link.getAttribute("href"))!);
  expect(href.origin).toBe("https://wa.me");
  const text = href.searchParams.get("text")!;
  expect(text).toContain("«Ruta costera de Papudo»");
  expect(text).toMatch(/1\. .+, 2\. .+, 3\. /);
});

test("recorrido: «Enviar por WhatsApp» lleva el recorrido en orden", async ({
  page,
}) => {
  await page.goto("/es");
  await page.evaluate((k) => {
    localStorage.setItem(
      k,
      JSON.stringify({
        slugs: ["papudo-plaza", "playa-chica-papudo"],
        start: null,
        returnToStart: false,
        startTime: "10:00",
        orderMode: "manual",
      }),
    );
  }, KEY);
  await page.goto("/es/recorrido");
  const link = page.getByRole("link", { name: "Enviar por WhatsApp" });
  const text = async () =>
    new URL((await link.getAttribute("href"))!).searchParams.get("text") ?? "";
  await expect.poll(text).toContain("/es/recorrido?l=");
  const sent = await text();
  expect(sent).toContain("Te comparto mi recorrido por Papudo (2 paradas)");
  expect(sent).toContain("l=papudo-plaza%2Cplaya-chica-papudo&h=10%3A00");
});

test("Mi local: sin enlace explica cómo pedirlo; uno inválido avisa", async ({
  page,
}) => {
  await page.goto("/local");
  await expect(
    page.getByRole("heading", { name: "Necesitas el enlace de tu local" }),
  ).toBeVisible();
  await page.goto(`/local/entrar?llave=${"0".repeat(48)}`);
  await expect(page).toHaveURL(/\/local\?error=enlace$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "Ese enlace no es válido" }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    ),
  ).toEqual([]);
});

test("recorrido: los tiempos salen del camino por calle, a pie o en auto", async ({
  page,
}) => {
  await page.route("**/api/ruta/paradas**", (route) => {
    const mode = new URL(route.request().url()).searchParams.get("mode");
    const car = mode === "car";
    return route.fulfill({
      json: {
        mode,
        distanceMeters: car ? 2200 : 900,
        durationSeconds: car ? 300 : 720,
        coordinates: STREET_PATH.coordinates,
        legs: [
          {
            distanceMeters: car ? 2200 : 900,
            durationSeconds: car ? 300 : 720,
          },
        ],
      },
    });
  });
  await page.goto("/es/recorrido?l=papudo-plaza,playa-chica-papudo&h=10:00");
  await expect(page.getByText("Tiempos por calle, a pie")).toBeVisible();
  await expect(page.getByText("↓ 12 min de traslado · 0,9 km")).toBeVisible();
  await page.getByRole("button", { name: "En auto" }).click();
  await expect(page.getByText("Tiempos por calle, en auto")).toBeVisible();
  await expect(page.getByText("↓ 5 min de traslado · 2,2 km")).toBeVisible();
});

test("recorrido: si no hay camino por calle, avisa que es una estimación", async ({
  page,
}) => {
  await page.route("**/api/ruta/paradas**", (route) =>
    route.fulfill({ status: 502, json: { error: "upstream" } }),
  );
  await page.goto("/es/recorrido?l=papudo-plaza,playa-chica-papudo&h=10:00");
  await expect(
    page.getByText(/Tiempos estimados: distancia en línea recta/),
  ).toBeVisible();
});
