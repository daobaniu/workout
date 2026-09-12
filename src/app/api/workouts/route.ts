import { completeWorkout, deletePendingWorkout } from "@/lib/db/queries";
import { programService } from "@/lib/fitness/programs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string | undefined;
    const id = body.id as string | undefined;
    const source = (body.source as "session" | "legacy" | undefined) ?? "session";

    if (!id) {
      return Response.json({ ok: false, error: "缺少训练 id" }, { status: 400 });
    }

    if (action === "complete") {
      if (source === "legacy") {
        const workout = await completeWorkout(id);
        return Response.json({ ok: true, workout, source: "legacy" });
      }
      const setLogs = Array.isArray(body.setLogs) ? body.setLogs : undefined;
      const session = await programService.completeSession(id, {
        durationMin: body.durationMin,
        weightKg: body.weightKg,
        setLogs,
      });
      return Response.json({ ok: true, session, source: "session" });
    }

    return Response.json({ ok: false, error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const id = body?.id as string | undefined;
    const source = (body?.source as "session" | "legacy" | undefined) ?? "session";

    if (!id) {
      return Response.json({ ok: false, error: "缺少训练 id" }, { status: 400 });
    }

    await deletePendingWorkout(id, source);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
