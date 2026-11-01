import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
    page.getByRole("button", { name: /Agregar a mi recorrido/ }),
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

test("Escuchar lee la ficha en orden con voz en español, pausa y sigue", async ({
  page,
}) => {
  // Voz falsa: registra lo que se lee y termina cada trozo al instante.
  await page.addInitScript(() => {
    const said: { text: string; lang: string }[] = [];
    (window as unknown as { __said: typeof said }).__said = said;
    class FakeUtterance {
      text: string;
      lang = "";
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    let pending: ReturnType<typeof setTimeout> | null = null;
    const synth = {
      speaking: false,
      getVoices: () => [{ lang: "es-MX", name: "Paulina" }],
      addEventListener: () => {},
      removeEventListener: () => {},
      cancel: () => {
        if (pending) clearTimeout(pending);
        synth.speaking = false;
      },
      speak: (u: FakeUtterance) => {
        said.push({ text: u.text, lang: u.lang });
        synth.speaking = true;
        pending = setTimeout(() => u.onend?.(), 150);
      },
    };
    Object.defineProperty(window, "speechSynthesis", { value: synth });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      value: FakeUtterance,
    });
  });
  await page.goto("/es/lugares/playa-chica-papudo");
  const listen = page.getByRole("button", {
    name: /Escuchar la ficha de Playa Chica/,
  });
  await listen.click();
  await expect(page.getByRole("button", { name: "Pausar" })).toBeVisible();
  await page.getByRole("button", { name: "Pausar" }).click();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(
    page.getByRole("button", { name: /Escuchar la ficha/ }),
  ).toBeVisible({ timeout: 15_000 });
  const said = await page.evaluate(
    () =>
      (window as unknown as { __said: { text: string; lang: string }[] })
        .__said,
  );
  expect(said[0]).toEqual({ text: "Playa Chica.", lang: "es-MX" });
  expect(said.map((s) => s.text).join(" ")).toContain("Playa Chica");
  await expect(page.locator("#resumen [aria-live=polite]")).toHaveText(
    "Lectura terminada",
  );
});
