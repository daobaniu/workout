import { checkInService } from "@/lib/fitness/programs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year") ?? new Date().getFullYear());
  const month = Number(searchParams.get("month") ?? new Date().getMonth() + 1);
  const data = await checkInService.monthCalendar(year, month);
  return Response.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action as string;

  try {
    if (action === "check_in") {
      const checkIn = await checkInService.checkIn(
        body.note,
        body.workoutSessionId,
      );
      return Response.json({ ok: true, checkIn });
    }

    if (action === "undo") {
      await checkInService.undo(body.dateKey);
      return Response.json({ ok: true });
    }

    if (action === "today") {
      const checkIn = await checkInService.getToday();
      return Response.json({ ok: true, checkIn });
    }

    return Response.json({ ok: false, error: "未知操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
