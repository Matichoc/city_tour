import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { STATIC_CONTENT } from "@/content";
import { CATEGORY_DEFS } from "@/content/catalog";
import { contentToSql } from "@/lib/db/content-sql";

const root = path.resolve(import.meta.dirname, "../..");

describe("supabase/content.sql", () => {
  it("está al día con src/content (regenerar con `pnpm db:content`)", async () => {
    await expect(contentToSql(STATIC_CONTENT)).toMatchFileSnapshot(
      path.join(root, "supabase/content.sql"),
    );
  });

  it("escapa comillas simples", () => {
    const sql = contentToSql({
      ...STATIC_CONTENT,
      localities: [
        {
          slug: "x",
          es: "O'Higgins",
          en: "O'Higgins",
          latitude: null,
          longitude: null,
        },
      ],
    });
    expect(sql).toContain("'O''Higgins'");
  });

  it("deja todo pendiente de verificación", () => {
    expect(contentToSql(STATIC_CONTENT)).not.toMatch(
      /verification_status\s*=\s*'verified'/,
    );
  });
});

describe("supabase/seed.sql", () => {
  it("tiene las mismas categorías que src/content/catalog.ts", () => {
    const seed = readFileSync(path.join(root, "supabase/seed.sql"), "utf8");
    for (const c of CATEGORY_DEFS) {
      expect(seed).toContain(
        `('${c.slug}', ${CATEGORY_DEFS.indexOf(c) + 1}, ${c.defaultVisitMinutes}, '${c.es}', '${c.en}', '${c.pt}')`,
      );
    }
  });
});
