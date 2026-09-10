import { getTodayOverview } from "@/lib/db/queries";

export async function GET() {
  const overview = await getTodayOverview();
  return Response.json(overview);
}
