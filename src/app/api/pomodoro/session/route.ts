import { NextRequest, NextResponse } from "next/server";
import { getPomodoroData, savePomodoroSession, type PomodoroSession } from "@/lib/pomodoro";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      session?: Partial<PomodoroSession>;
    };
    const session = await savePomodoroSession(payload.session ?? {});
    const data = await getPomodoroData();

    return NextResponse.json({ ...data, session });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить Pomodoro-сессию." },
      { status: 500 },
    );
  }
}
