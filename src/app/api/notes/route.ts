import { NextRequest, NextResponse } from "next/server";
import {
  getDailyNotes,
  getDailyNoteByDate,
  saveDailyNote,
} from "@/lib/daily-notes.server";
import type { DailyNoteDifficulty, DailyNoteMood } from "@/lib/daily-notes.types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const moods = new Set<DailyNoteMood>(["easy", "normal", "hard", "max"]);
const difficulties = new Set<DailyNoteDifficulty>(["easy", "normal", "hard", "veryHard"]);

function getDate(request: NextRequest) {
  return request.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
}

function getLimit(request: NextRequest) {
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 14);

  return Number.isFinite(rawLimit) ? rawLimit : 14;
}

export async function GET(request: NextRequest) {
  try {
    const [note, notes] = await Promise.all([
      getDailyNoteByDate(getDate(request)),
      getDailyNotes(getLimit(request)),
    ]);

    return NextResponse.json({ note, notes });
  } catch {
    return NextResponse.json(
      { note: null, notes: [], error: "Не удалось прочитать заметки." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      date?: string;
      mood?: DailyNoteMood;
      difficulty?: DailyNoteDifficulty;
      beforeText?: string;
      afterText?: string;
      text?: string;
    };
    const date = payload.date ?? new Date().toISOString().slice(0, 10);
    const mood = payload.mood && moods.has(payload.mood) ? payload.mood : "normal";
    const difficulty =
      payload.difficulty && difficulties.has(payload.difficulty) ? payload.difficulty : undefined;
    const text = payload.text ?? "";
    const note = await saveDailyNote({
      date,
      mood,
      difficulty,
      beforeText: payload.beforeText,
      afterText: payload.afterText,
      text,
    });
    const notes = await getDailyNotes(14);

    return NextResponse.json({ note, notes });
  } catch {
    return NextResponse.json(
      { error: "Не удалось сохранить заметку." },
      { status: 500 },
    );
  }
}
