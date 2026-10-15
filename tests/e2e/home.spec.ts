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

test("portada: mapa 3D de la comuna con accesos a los pueblos", async ({
  page,
}) => {
  await page.goto("/es");
  await expect(
    page.getByRole("heading", { name: "La comuna en 3D" }),
  ).toBeVisible();
  const villages = page.getByRole("list", { name: "Pueblos de la comuna" });
  await expect(villages.getByRole("link")).toHaveCount(3);
});

test("recorrido en vivo: sigue la ubicación y ofrece la cámara en tramos cortos", async ({
  page,
  context,
}) => {
  // Junto a Playa Chica: la primera parada queda a pocos cientos de metros.
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -32.5085, longitude: -71.4485 });
  await page.goto("/es/recorrido?l=playa-chica-papudo,playa-papudo");
  await page.getByRole("button", { name: /Iniciar recorrido/ }).click();
  const live = page.getByRole("dialog", { name: "Recorrido en vivo" });
  await expect(live).toBeVisible();
  await expect(live.getByText(/a pie/)).toBeVisible();
  await expect(
    live
      .getByRole("button", { name: /Guíame con la cámara/ })
      .or(live.getByText(/Llegaste/).first()),
  ).toBeVisible();
  await live.getByRole("button", { name: "Terminar" }).click();
  await expect(live).toBeHidden();
});

test("ficha: guardar un lugar y verlo en Tus guardados, sin reseñas inventadas", async ({
  page,
}) => {
  await page.goto("/es/lugares/playa-chica-papudo");
  await expect(page.getByText("Sin opiniones aún").first()).toBeVisible();
  await expect(page.getByText("Sé el primero en opinar")).toBeVisible();
  const save = page.getByRole("button", { name: "Guardar" });
  await save.click();
  await expect(page.getByRole("button", { name: "Guardado" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.goto("/es/recorrido");
  await expect(
    page.getByRole("heading", { name: "Tus guardados" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Playa Chica" })).toBeVisible();
});
