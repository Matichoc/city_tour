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
  await page.goto("/es/explorar?categoria=balneario");
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

test("recorrido en vivo: el modo demostración simula la caminata sin GPS", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("/es/recorrido?l=playa-chica-papudo,playa-papudo");
  await page
    .getByRole("button", { name: /Probar con ubicación simulada/ })
    .click();
  const live = page.getByRole("dialog", { name: "Recorrido en vivo" });
  await expect(live.getByText(/Modo demostración/)).toBeVisible();
  await expect(live.getByText(/a pie/)).toBeVisible();
  await expect(
    live.getByRole("button", { name: /Guíame con la cámara/ }),
  ).toBeVisible();
  // La ubicación simulada llega sola a la parada.
  await expect(
    live.getByRole("button", { name: "Ir a la siguiente parada" }),
  ).toBeVisible({ timeout: 45_000 });
});

test("recorrido en vivo: si estás cerca de una parada que no es la primera, la ofrece y activa la cámara", async ({
  page,
  context,
}) => {
  // Junto a Salinas de Pullally (a ~12 km de Playa Papudo, la primera parada).
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: -32.4165, longitude: -71.4115 });
  await page.goto("/es/recorrido?l=playa-papudo,papudo-salinas-pullally");
  await page.getByRole("button", { name: /Iniciar recorrido/ }).click();
  const live = page.getByRole("dialog", { name: "Recorrido en vivo" });
  await expect(
    live.getByText(/Estás más cerca de Salinas de Pullally/),
  ).toBeVisible();
  // La cámara también se ofrece para la parada lejana, como dirección.
  await expect(
    live.getByRole("button", { name: /Ver la dirección con la cámara/ }),
  ).toBeVisible();
  await live.getByRole("button", { name: "Ir a Salinas de Pullally" }).click();
  await expect(
    live.getByRole("button", { name: /Guíame con la cámara/ }),
  ).toBeVisible();
});

test("agenda de eventos: lista con fuente, filtro por producto y aviso de fechas", async ({
  page,
}) => {
  await page.goto("/es/eventos");
  await expect(
    page.getByRole("heading", { name: "Agenda de eventos", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByText(/sin fecha de una edición concreta/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Aniversario del Combate Naval/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Gastronomía" }).click();
  await expect(page).toHaveURL(/categoria=gastronomia/);
  await expect(
    page.getByRole("heading", { name: /Feria Internacional de Integración/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Combate Naval/ }),
  ).toHaveCount(0);
});

test("portada: acceso a la agenda de eventos", async ({ page }) => {
  await page.goto("/es");
  await page.getByRole("link", { name: /Fiestas y celebraciones/ }).click();
  await expect(page).toHaveURL(/\/es\/eventos$/);
});

test("quiosco: navega por producto, muestra el QR de la ficha y vuelve solo al inicio", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/es/quiosco");
  await expect(
    page.getByRole("heading", { name: "¿Qué quieres descubrir?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^Balneario/ }).click();
  await page
    .getByRole("button", { name: /Playa Chica/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Playa Chica", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Código QR para abrir esta página/ }),
  ).toBeVisible();
  // Sin tocar la pantalla: avisa y vuelve al inicio.
  await page.clock.runFor(76_000);
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.clock.runFor(16_000);
  await expect(
    page.getByRole("heading", { name: "¿Qué quieres descubrir?" }),
  ).toBeVisible();
});

test("portugués: cambia de idioma, traduce la interfaz y avisa si falta la traducción del contenido", async ({
  page,
}) => {
  await page.goto("/es/rutas");
  await page.getByRole("button", { name: "pt", exact: true }).click();
  await expect(page).toHaveURL(/\/pt\/roteiros$/);
  await expect(
    page.getByRole("heading", { name: "Roteiros", level: 1 }),
  ).toBeVisible();
  await page.goto("/pt/lugares/playa-chica-papudo");
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
  await expect(page.getByText("Somente em espanhol").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar" })).toBeVisible();
});

test("QR por hito: el afiche lleva a la ficha del lugar; la ruta trae su QR", async ({
  page,
}) => {
  await page.goto("/es/qr?lugar=playa-chica-papudo");
  await expect(
    page.getByRole("heading", { name: "Conoce Playa Chica" }),
  ).toBeVisible();
  await expect(
    page.getByText(/\/es\/lugares\/playa-chica-papudo\?origen=hito-/),
  ).toBeVisible();
  await page.goto("/es/rutas/papudo-a-pie");
  await expect(
    page.getByRole("img", { name: "Código QR de esta ruta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Imprimir ruta" }),
  ).toBeVisible();
});
