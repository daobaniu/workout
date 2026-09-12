import { buildWeeklySummary } from "@/lib/fitness/weekly-summary";

export async function GET() {
  const summary = await buildWeeklySummary();
  return Response.json({ ok: true, summary });
}
