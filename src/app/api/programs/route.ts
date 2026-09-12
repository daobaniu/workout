import { loadProgramsPageData } from "@/lib/fitness/programs/programs-page-data";
import { programService } from "@/lib/fitness/programs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeFilter = searchParams.get("place") as "home" | "gym" | null;
  const data = await loadProgramsPageData({ place: placeFilter });
  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "adopt_builtin") {
      const program = await programService.adoptBuiltin(
        body.key,
        body.place,
        body.activate !== false,
      );
      return Response.json({ ok: true, program });
    }

    if (action === "create_custom") {
      const program = await programService.createCustom(
        {
          name: body.name,
          source: "custom",
          splitType: body.splitType ?? "custom",
          place: body.place ?? "gym",
          notes: body.notes,
          days: body.days,
        },
        body.activate !== false,
      );
      return Response.json({ ok: true, program });
    }

    if (action === "update_custom") {
      if (!body.id) {
        return Response.json({ ok: false, error: "缺少计划 id" }, { status: 400 });
      }
      const program = await programService.updateCustom(
        body.id,
        {
          name: body.name,
          source: "custom",
          splitType: body.splitType ?? "custom",
          place: body.place ?? "gym",
          notes: body.notes,
          days: body.days,
        },
        body.activate === true ? true : undefined,
      );
      return Response.json({ ok: true, program });
    }

    if (action === "activate") {
      const program = await programService.activate(body.id);
      return Response.json({ ok: true, program });
    }

    if (action === "delete") {
      await programService.delete(body.id);
      return Response.json({ ok: true });
    }

    if (action === "start_today") {
      const result = await programService.startTodaySession({
        durationMin: body.durationMin,
        checkIn: body.checkIn === true,
        notes: body.notes,
      });
      return Response.json({ ok: true, ...result });
    }

    if (action === "complete_session") {
      const session = await programService.completeSession(body.sessionId, {
        durationMin: body.durationMin,
        weightKg: body.weightKg,
      });
      return Response.json({ ok: true, session });
    }

    return Response.json({ ok: false, error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
