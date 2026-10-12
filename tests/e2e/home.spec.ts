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
