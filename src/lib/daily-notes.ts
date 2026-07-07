export type {
  DailyNote,
  DailyNoteDifficulty,
  DailyNoteInput,
  DailyNoteMood,
} from "@/lib/daily-notes.types";
export { dailyNoteDifficulties, dailyNoteMoods } from "@/lib/daily-notes.types";

export function hasDailyNoteContent(note: {
  beforeText?: string;
  afterText?: string;
  text?: string;
}) {
  return Boolean(note.beforeText?.trim() || note.afterText?.trim() || note.text?.trim());
}
