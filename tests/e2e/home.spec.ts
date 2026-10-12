import { expect, test } from "@playwright/test";

test("la raíz dirige a /es y se ve la portada", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Papudo");
});

test("cambiar a inglés conserva la página", async ({ page }) => {
  await page.goto("/es/explorar");
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/explore$/);
});

test("explorar: filtrar por categoría y abrir una ficha con fuente", async ({
  page,
}) => {
  await page.goto("/es/explorar?categoria=playas");
  await expect(
    page.getByRole("heading", { name: "Playa Chica" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Playa Chica/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Playa Chica",
  );
  await expect(
    page.getByText("Pendiente de verificación").first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Tripadvisor/ })).toBeVisible();
});

test("recorrido: agregar una ruta, ver paradas ordenadas y tiempos", async ({
  page,
}) => {
  await page.goto("/es/rutas");
  await page
    .getByRole("link", { name: /Ruta costera de Papudo/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Agregar la ruta a mi recorrido" })
    .click();
  await expect(page).toHaveURL(/\/es\/recorrido$/);
  await expect(
    page
      .getByRole("heading", { name: "Resumen" })
      .or(page.getByText("Duración")),
  ).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Cómo llegar" }),
  ).toHaveCount(3);
});
