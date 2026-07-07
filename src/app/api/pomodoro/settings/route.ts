import { NextRequest, NextResponse } from "next/server";
import {
  getPomodoroSettings,
  savePomodoroSettings,
  type PomodoroSettings,
} from "@/lib/pomodoro";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getPomodoroSettings();

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { settings: null, error: "Не удалось прочитать настройки Pomodoro." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      settings?: Partial<PomodoroSettings>;
    };
    const settings = await savePomodoroSettings(payload.settings ?? {});

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить настройки Pomodoro." },
      { status: 500 },
    );
  }
}
