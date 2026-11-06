import { describe, expect, it } from "vitest";
import { activeHref, businessDue, navGroups } from "@/lib/admin/nav";
import es from "@/messages/es.json";

const all = navGroups({ canEdit: true, superadmin: true });
const hrefs = (g: ReturnType<typeof navGroups>) =>
  g.flatMap((x) => x.items.map((i) => i.href));

describe("menú lateral del panel", () => {
  it("muestra Propuestas y Equipo a todos; enlaces y carga solo a quien edita", () => {
    const viewer = hrefs(navGroups({ canEdit: false, superadmin: false }));
    expect(viewer).toContain("/admin/propuestas");
    expect(viewer).toContain("/admin/equipo");
    expect(viewer).not.toContain("/admin/comercios/enlaces");
    expect(hrefs(all)).toContain("/admin/comercios/importar");
  });

  it("titula el grupo de Equipo como Superadmin solo para el superadmin", () => {
    expect(all.at(-1)!.key).toBe("superadmin");
    expect(navGroups({ canEdit: true, superadmin: false }).at(-1)!.key).toBe(
      "team",
    );
  });

  it("cada enlace y grupo tiene su texto", () => {
    const nav = es.admin.nav as Record<string, unknown> & {
      groups: Record<string, string>;
    };
    for (const g of all) {
      if (g.key) expect(nav.groups[g.key]).toBeTruthy();
      for (const i of g.items) expect(nav[i.key]).toBeTruthy();
    }
  });

  it("marca la página actual con el enlace más específico", () => {
    expect(activeHref(all, "/admin", null)).toBe("/admin");
    expect(activeHref(all, "/admin/comercios/enlaces", null)).toBe(
      "/admin/comercios/enlaces",
    );
    expect(activeHref(all, "/admin/comercios/abc", null)).toBe(
      "/admin/comercios",
    );
    expect(activeHref(all, "/admin/propuestas/xyz", null)).toBe(
      "/admin/propuestas",
    );
  });

  it("marca el tipo de ficha en la lista y en el detalle", () => {
    expect(activeHref(all, "/admin/fichas", "evento")).toBe(
      "/admin/fichas?tipo=evento",
    );
    expect(activeHref(all, "/admin/fichas", null)).toBe(
      "/admin/fichas?tipo=lugar",
    );
    expect(activeHref(all, "/admin/ruta/123", null)).toBe(
      "/admin/fichas?tipo=ruta",
    );
  });
});

describe("comercios por actualizar", () => {
  it("cuenta vencidos, por vencer y sin fecha", () => {
    expect(businessDue(["ok", "overdue", "soon", "never", "overdue"])).toEqual({
      overdue: 2,
      soon: 1,
      never: 1,
    });
  });
});
