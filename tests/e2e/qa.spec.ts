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

test("los negocios llegan a la página de inscripción desde la portada", async ({
  page,
}) => {
  await page.goto("/es");
  await page
    .getByRole("link", { name: /¿Tienes un negocio en Papudo\?/ })
    .click();
  await expect(page).toHaveURL(/\/es\/negocios$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Para negocios",
  );
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
  "/es/lugares/playa-papudo",
  "/es/rutas/papudo-a-pie",
  "/es/recorrido",
  "/es/informacion",
  "/es/negocios",
  "/en",
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
