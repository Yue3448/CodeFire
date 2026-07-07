import type { SeasonReward } from "@/lib/seasons";

export type SeasonPassLevel = {
  level: number;
  requiredSeasonXp: number;
  reward: SeasonReward;
  unlocked: boolean;
};

export type SeasonPassProgress = {
  level: number;
  seasonXp: number;
  nextLevelXp: number;
  progressPercent: number;
  levels: SeasonPassLevel[];
};

function requiredXpForLevel(level: number) {
  return Math.max(0, (level - 1) * (level - 1) * 120);
}

export function getSeasonPassProgress(seasonXp: number, rewards: SeasonReward[]): SeasonPassProgress {
  const level = Math.floor(Math.sqrt(Math.max(0, seasonXp) / 120)) + 1;
  const currentLevelXp = requiredXpForLevel(level);
  const nextLevelXp = requiredXpForLevel(level + 1);
  const progressPercent = nextLevelXp > currentLevelXp
    ? Math.min(100, Math.max(0, ((seasonXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
    : 100;
  const maxRewardLevel = Math.max(8, ...rewards.map((reward) => reward.level ?? 1));
  const levels = Array.from({ length: maxRewardLevel }, (_, index) => {
    const passLevel = index + 1;
    const reward =
      rewards.find((item) => (item.level ?? 1) === passLevel) ?? {
        id: `season-pass-${passLevel}`,
        level: passLevel,
        title: passLevel % 2 === 0 ? "Season XP cache" : "Campfire mark",
        type: "cosmetic" as const,
        unlocked: false,
      };

    return {
      level: passLevel,
      requiredSeasonXp: requiredXpForLevel(passLevel),
      reward,
      unlocked: seasonXp >= requiredXpForLevel(passLevel),
    };
  });

  return {
    level,
    seasonXp,
    nextLevelXp,
    progressPercent,
    levels,
  };
}
