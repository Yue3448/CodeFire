export type DailyNoteMood = "easy" | "normal" | "hard" | "max";
export type DailyNoteDifficulty = "easy" | "normal" | "hard" | "veryHard";

export const dailyNoteMoods = ["easy", "normal", "hard", "max"] as const;
export const dailyNoteDifficulties = ["easy", "normal", "hard", "veryHard"] as const;

export type DailyNote = {
  date: string;
  mood?: DailyNoteMood;
  difficulty?: DailyNoteDifficulty;
  beforeText?: string;
  afterText?: string;
  text?: string;
  updatedAt: string;
};

export type DailyNoteInput = Omit<DailyNote, "updatedAt">;
