import { NextResponse } from "next/server";
import { getCachedFullCodeFireData } from "@/lib/codefire-cache.server";
import { getManualStudyEntries, getManualStudyStats } from "@/lib/manual-study";
import { getStepikEntries, getStepikStats } from "@/lib/stepik";
import { calculateStudyTaskProgressList } from "@/lib/study-progress";
import { getStudyTaskStats } from "@/lib/study-tasks";
import { getStudyTasks } from "@/lib/study-tasks.server";
import { getTopicTracker } from "@/lib/topics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STUDY_FULL_DATA_TIMEOUT_MS = 12_000;

function timeout<T>(promise: Promise<T>, ms: number, label: string) {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });

  return Promise.race<T>([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

async function getLocalStudyPayload(todayDate: string) {
  const [tasks, stepikEntries, manualStudy] = await Promise.all([
    getStudyTasks(500),
    getStepikEntries(500),
    getManualStudyEntries(500),
  ]);
  const topics = await getTopicTracker({
    tasks,
    stepikEntries,
    manualStudy,
    notes: [],
    todayDate,
  });
  const taskProgress = calculateStudyTaskProgressList({
    days: [],
    tasks,
    stepikEntries,
    manualStudy,
    topics,
    todayDate,
  });

  return {
    todayDate,
    codingDays: [],
    studyTasks: {
      items: tasks,
      stats: getStudyTaskStats(tasks, todayDate),
    },
    taskProgress,
    stepik: {
      entries: stepikEntries,
      stats: getStepikStats(stepikEntries, todayDate),
    },
    manualStudy: {
      entries: manualStudy,
      stats: getManualStudyStats(manualStudy, todayDate),
    },
    topics,
    difficulties: {},
    todayDifficulty: null,
    goals: null,
    weeklyJournal: null,
  };
}

export async function GET() {
  const apiKey = process.env.WAKATIME_API_KEY;
  const todayDate = new Date().toISOString().slice(0, 10);

  if (!apiKey) {
    return NextResponse.json({
      configured: true,
      generatedAt: new Date().toISOString(),
      ...(await getLocalStudyPayload(todayDate)),
      warning: "WAKATIME_API_KEY not found. Showing local study data only.",
    });
  }

  try {
    const { data, cache } = await timeout(
      getCachedFullCodeFireData(apiKey),
      STUDY_FULL_DATA_TIMEOUT_MS,
      "/api/study full CodeFire data",
    );
    const learning = data.rpg?.learning;
    const tasks = learning?.studyTasks.items ?? [];
    const stepikEntries = learning?.stepik.entries ?? [];
    const manualStudy = learning?.manualStudy.entries ?? [];
    const topics = learning?.topics ?? [];
    const codingDays = data.last365Days.days ?? data.last30Days.days;
    const taskProgress = calculateStudyTaskProgressList({
      days: codingDays,
      tasks,
      stepikEntries,
      manualStudy,
      topics,
      todayDate: data.today.date,
    });

    return NextResponse.json(
      {
        configured: true,
        generatedAt: data.generatedAt,
        todayDate: data.today.date,
        codingDays,
        studyTasks: learning?.studyTasks ?? null,
        taskProgress,
        stepik: learning?.stepik ?? null,
        manualStudy: learning?.manualStudy ?? null,
        topics,
        difficulties: learning?.difficulties ?? {},
        todayDifficulty: learning?.todayDifficulty ?? null,
        goals: learning?.goals ?? null,
        weeklyJournal: learning?.weeklyJournal ?? null,
      },
      {
        headers: {
          "X-CodeFire-Cache": cache,
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load study data.";
    console.error("[study] GET error", message);

    return NextResponse.json({
      configured: true,
      generatedAt: new Date().toISOString(),
      ...(await getLocalStudyPayload(todayDate)),
      warning: message,
    });
  }
}
