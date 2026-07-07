import { NextRequest, NextResponse } from "next/server";
import {
  getPomodoroData,
  savePomodoroSession,
  savePomodoroSettings,
  type PomodoroSession,
  type PomodoroSettings,
} from "@/lib/pomodoro";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await getPomodoroData();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        settings: null,
        sessions: [],
        stats: null,
        error: "Не удалось прочитать Pomodoro-данные.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      action?: "session" | "settings";
      session?: Partial<PomodoroSession>;
      settings?: Partial<PomodoroSettings>;
    };

    if (payload.action === "settings") {
      const settings = await savePomodoroSettings(payload.settings ?? {});
      const data = await getPomodoroData();

      return NextResponse.json({ ...data, settings });
    }

    const session = await savePomodoroSession(payload.session ?? {});
    const data = await getPomodoroData();

    return NextResponse.json({ ...data, session });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить Pomodoro-данные." },
      { status: 500 },
    );
  }
}
