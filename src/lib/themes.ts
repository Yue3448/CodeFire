import { normalizeText, readJsonStore, writeJsonStore } from "@/lib/local-json-store.server";

export type CodeFireTheme = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockCondition: string;
  className?: string;
  cssVars?: Record<string, string>;
};

export type ThemeState = {
  selectedThemeId: string;
  themes: CodeFireTheme[];
};

type ThemesFile = {
  version: 1;
  selectedThemeId: string;
  unlocked: Record<string, string>;
};

const fileName = "codefire-unlocked-themes.json";

const catalog: CodeFireTheme[] = [
  { id: "classic", name: "CodeFire Classic", description: "Базовый огненный dark UI.", unlocked: true, unlockCondition: "Default" },
  { id: "campfire", name: "Campfire", description: "Мягкий костёр и тёплые акценты.", unlocked: false, unlockCondition: "7 active days", className: "theme-campfire" },
  { id: "python-green", name: "Python Green", description: "Зелёный Python-фокус.", unlocked: false, unlockCondition: "Season level 6", className: "theme-python" },
  { id: "gold-forge", name: "Gold Forge", description: "Золотая кузница прогресса.", unlocked: false, unlockCondition: "5000 Coding XP", className: "theme-gold" },
  { id: "recovery-moon", name: "Recovery Moon", description: "Спокойная тема для лёгких дней.", unlocked: false, unlockCondition: "Light Day", className: "theme-recovery" },
  { id: "mythic-flame", name: "Mythic Flame", description: "Мифический огонь поздних рангов.", unlocked: false, unlockCondition: "Legendary rank", className: "theme-mythic" },
];

async function readThemesFile(): Promise<ThemesFile> {
  const data = await readJsonStore<Partial<ThemesFile>>(fileName, {
    version: 1,
    selectedThemeId: "classic",
    unlocked: { classic: new Date().toISOString() },
  });

  return {
    version: 1,
    selectedThemeId: data.selectedThemeId ?? "classic",
    unlocked: { classic: new Date().toISOString(), ...(data.unlocked ?? {}) },
  };
}

export async function getThemeState(): Promise<ThemeState> {
  const data = await readThemesFile();

  return {
    selectedThemeId: data.selectedThemeId,
    themes: catalog.map((theme) => ({
      ...theme,
      unlocked: Boolean(data.unlocked[theme.id]),
    })),
  };
}

export async function unlockTheme(themeId: string) {
  const data = await readThemesFile();
  const id = normalizeText(themeId, 80);

  if (catalog.some((theme) => theme.id === id)) {
    data.unlocked[id] ??= new Date().toISOString();
    await writeJsonStore<ThemesFile>(fileName, data);
  }

  return getThemeState();
}

export async function selectTheme(themeId: string) {
  const data = await readThemesFile();
  const id = normalizeText(themeId, 80);

  if (data.unlocked[id]) {
    data.selectedThemeId = id;
    await writeJsonStore<ThemesFile>(fileName, data);
  }

  return getThemeState();
}
