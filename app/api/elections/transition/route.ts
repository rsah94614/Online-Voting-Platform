// app/api/elections/transition/route.ts
// Auto-transitions elections based on start/end dates
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { transitionElections } from "@/lib/transitions";

// POST /api/elections/transition — callable by admin or cron
export async function POST(req: NextRequest) {
  // Allow access via cron secret OR admin auth
  const cronSecret = req.headers.get("x-cron-secret");
  const validCron = cronSecret && cronSecret === process.env.CRON_SECRET;

  if (!validCron) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const result = await transitionElections();
  return NextResponse.json({ ok: true, ...result });
}
