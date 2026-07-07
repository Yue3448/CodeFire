import { hasDailyNoteContent, type DailyNote } from "@/lib/daily-notes";
import type { ManualStudyEntry } from "@/lib/manual-study";
import { manualStudyAdventureXp } from "@/lib/manual-study";
import type { StepikEntry } from "@/lib/stepik";
import { stepikAdventureXp } from "@/lib/stepik";
import type { StudyTask } from "@/lib/study-tasks";
import { studyTaskAdventureXp } from "@/lib/study-tasks";
import type { BossFight } from "@/lib/boss-fights";

export type XpBreakdown = {
  codingXp: number;
  adventureXp: number;
  seasonXp: number;
  totalDisplayXp: number;
};

export function getAdventureXpBreakdown({
  codingXp,
  tasks,
  stepikEntries,
  manualStudy,
  notes,
  bosses,
  questXp = 0,
  eventXp = 0,
}: {
  codingXp: number;
  tasks: StudyTask[];
  stepikEntries: StepikEntry[];
  manualStudy: ManualStudyEntry[];
  notes: DailyNote[];
  bosses: BossFight[];
  questXp?: number;
  eventXp?: number;
}): XpBreakdown {
  const taskXp = tasks.reduce((sum, task) => sum + studyTaskAdventureXp(task), 0);
  const stepikXp = stepikEntries.reduce((sum, entry) => sum + stepikAdventureXp(entry), 0);
  const manualXp = manualStudy.reduce((sum, entry) => sum + manualStudyAdventureXp(entry), 0);
  const notesXp = notes.filter(hasDailyNoteContent).length * 8;
  const bossXp = bosses
    .filter((boss) => boss.completed)
    .reduce((sum, boss) => sum + boss.reward.adventureXp, 0);
  const adventureXp = taskXp + stepikXp + manualXp + notesXp + bossXp + questXp + eventXp;
  const seasonXp = adventureXp;

  return {
    codingXp,
    adventureXp,
    seasonXp,
    totalDisplayXp: codingXp + adventureXp,
  };
}
