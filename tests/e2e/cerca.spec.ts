import { expect, test } from "@playwright/test";

// Ubicación simulada en Las Salinas (junto a Roots Salinas y el humedal).
test.use({
  geolocation: { latitude: -32.4115, longitude: -71.4105 },
  permissions: ["geolocation"],
});

test("inicio: «Cerca de ti» muestra lo más cercano para comer, dormir y visitar", async ({
  page,
}) => {
  await page.goto("/es");
  const near = page.getByTestId("near-home");
  await near.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(near.getByRole("heading", { name: "Para comer" })).toBeVisible();
  await expect(
    near.getByRole("heading", { name: "Para dormir" }),
  ).toBeVisible();
  await expect(
    near.getByRole("heading", { name: "Qué visitar" }),
  ).toBeVisible();
  // Lo de Las Salinas va primero; lo sin coordenadas dice su pueblo.
  const comer = near.locator("ol").first();
  await expect(comer.getByRole("link").first()).toContainText("Roots Salinas");
  await expect(comer).toContainText("En Las Salinas");
  await expect(near).toContainText("Tu ubicación se usa solo en tu teléfono");
});

test("explorar: «Más cerca» ordena desde un pueblo", async ({ page }) => {
  await page.goto("/es/explorar");
  await page.getByTestId("sort-near").click();
  await page.getByRole("button", { name: "Pullally", exact: true }).click();
  await expect(page.getByTestId("near-from")).toHaveText("Desde Pullally");
  // La primera fila tiene distancia exacta (en metros o km).
  await expect(page.getByTestId("near-distance").first()).toHaveText(
    /^\d[\d,.]* (m|km)$/,
  );
  // «Sugeridos» vuelve al orden de la guía.
  await page.getByRole("button", { name: "Sugeridos" }).click();
  await expect(page.getByTestId("near-distance")).toHaveCount(0);
});

test("explorar: con la ubicación del teléfono", async ({ page }) => {
  await page.goto("/es/explorar?categoria=gastronomia");
  await page.getByTestId("sort-near").click();
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByTestId("near-from")).toHaveText("Desde tu ubicación");
  await expect(
    page
      .getByRole("list", { name: /lugares/i })
      .getByRole("heading")
      .first(),
  ).toHaveText("Roots Salinas");
});
