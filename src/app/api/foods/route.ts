import { deleteFood, getTodayNutrition, logFood, updateFood } from "@/lib/db/queries";
import {
  FOOD_CATALOG,
  resolveFoodLogEstimate,
  searchFoodCatalog,
} from "@/lib/fitness/foods";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 12) || 12, 30);
  const highProteinOnly = searchParams.get("protein") === "1";

  let items = q.trim()
    ? searchFoodCatalog(q, limit * 2)
    : highProteinOnly
      ? FOOD_CATALOG.filter(
          (f) => f.tags?.includes("protein") || f.serving.proteinG >= 15,
        )
      : searchFoodCatalog("", limit);

  if (highProteinOnly && q.trim()) {
    items = items.filter(
      (f) => f.tags?.includes("protein") || f.serving.proteinG >= 12,
    );
  }

  items = items.slice(0, limit);

  return Response.json({
    ok: true,
    items: items.map((f) => ({
      id: f.id,
      name: f.name,
      servingLabel: f.servingLabel,
      calories: f.serving.calories,
      proteinG: f.serving.proteinG,
      carbsG: f.serving.carbsG,
      fatG: f.serving.fatG,
      highCal: f.tags?.includes("high_cal") ?? false,
      note: f.note ?? null,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    if (!description) {
      return Response.json({ ok: false, error: "缺少食物描述" }, { status: 400 });
    }

    const hasMacros =
      body.calories != null &&
      body.calories !== "" &&
      Number.isFinite(Number(body.calories));

    if (hasMacros) {
      const calories = Number(body.calories);
      if (calories < 0) {
        return Response.json({ ok: false, error: "热量无效" }, { status: 400 });
      }
      const toNum = (v: unknown) => {
        if (v === undefined || v === null || v === "") return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      const entry = await logFood({
        description,
        calories,
        proteinG: toNum(body.proteinG),
        carbsG: toNum(body.carbsG),
        fatG: toNum(body.fatG),
        source:
          typeof body.source === "string" && body.source
            ? body.source
            : "manual",
      });
      const today = await getTodayNutrition();
      return Response.json({ ok: true, entry, today });
    }

    const resolved = resolveFoodLogEstimate({
      description,
      calories: 0,
      proteinG: 0,
    });
    if (!resolved.lookup.matched || !resolved.lookup.macros) {
      return Response.json(
        {
          ok: false,
          error: "食物库未命中，请带上热量或去对话让助手估算后记录",
        },
        { status: 400 },
      );
    }
    const entry = await logFood({
      description,
      calories: resolved.calories,
      proteinG: resolved.proteinG,
      carbsG: resolved.carbsG,
      fatG: resolved.fatG,
      source: resolved.source,
    });
    const today = await getTodayNutrition();
    return Response.json({
      ok: true,
      entry,
      today,
      warnings: resolved.lookup.warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "记录失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = body.id as string | undefined;
    if (!id) {
      return Response.json({ ok: false, error: "缺少饮食记录 id" }, { status: 400 });
    }

    const calories =
      body.calories != null && body.calories !== ""
        ? Number(body.calories)
        : undefined;
    if (calories != null && (!Number.isFinite(calories) || calories < 0)) {
      return Response.json({ ok: false, error: "热量无效" }, { status: 400 });
    }

    const toOptionalNumber = (v: unknown) => {
      if (v === undefined) return undefined;
      if (v === null || v === "") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const entry = await updateFood(id, {
      description:
        typeof body.description === "string" ? body.description.trim() : undefined,
      calories,
      proteinG: toOptionalNumber(body.proteinG),
      carbsG: toOptionalNumber(body.carbsG),
      fatG: toOptionalNumber(body.fatG),
    });
    const today = await getTodayNutrition();
    return Response.json({ ok: true, entry, today });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id = body?.id as string | undefined;
    if (!id) {
      return Response.json({ ok: false, error: "缺少饮食记录 id" }, { status: 400 });
    }
    await deleteFood(id);
    const today = await getTodayNutrition();
    return Response.json({ ok: true, today });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
