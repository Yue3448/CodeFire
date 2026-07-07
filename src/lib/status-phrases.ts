export type TodayStatusTone = "rest" | "warmup" | "good" | "strong" | "fire" | "legendary";

export type TodayStatus = {
  title: string;
  description: string;
  tone: TodayStatusTone;
};

type StatusGroup = {
  id: string;
  min: number;
  max: number;
  tone: TodayStatusTone;
  phrases: TodayStatus[];
};

const statusGroups: StatusGroup[] = [
  {
    id: "rest",
    min: 0,
    max: 0,
    tone: "rest",
    phrases: [
      { title: "Лагерь отдыха", description: "Пока нет активности за сегодня.", tone: "rest" },
      { title: "Тишина перед стартом", description: "Огонь ещё не разожжён.", tone: "rest" },
      { title: "Нулевой прогрев", description: "Сегодняшняя практика ещё впереди.", tone: "rest" },
    ],
  },
  {
    id: "micro",
    min: 1,
    max: 14,
    tone: "warmup",
    phrases: [
      { title: "Первая искра", description: "Ты уже открыл редактор — начало положено.", tone: "warmup" },
      { title: "Разогрев пальцев", description: "Небольшой старт лучше полного нуля.", tone: "warmup" },
      { title: "Микро-сессия", description: "Пара минут тоже поддерживает привычку.", tone: "warmup" },
    ],
  },
  {
    id: "spark",
    min: 15,
    max: 29,
    tone: "warmup",
    phrases: [
      { title: "Искра зажжена", description: "День начался. Пара коротких квестов усилит серию.", tone: "warmup" },
      { title: "Лёгкий старт", description: "Ты уже вошёл в кодинг-режим.", tone: "warmup" },
      { title: "Разминка выполнена", description: "Хорошее начало для учебного дня.", tone: "warmup" },
    ],
  },
  {
    id: "good-start",
    min: 30,
    max: 59,
    tone: "good",
    phrases: [
      { title: "Стабильный разгон", description: "Полчаса практики уже в копилке.", tone: "good" },
      { title: "Кодинг пошёл", description: "Темп набирается, можно закрыть ещё одну задачу.", tone: "good" },
      { title: "Рабочий ритм", description: "Ты уже не просто открыл проект, а реально поработал.", tone: "good" },
    ],
  },
  {
    id: "hour",
    min: 60,
    max: 89,
    tone: "good",
    phrases: [
      { title: "Уверенный прогрев", description: "Хороший темп: час практики уже в копилке.", tone: "good" },
      { title: "Час силы", description: "Один час кодинга — это уже заметный вклад.", tone: "good" },
      { title: "Практика закреплена", description: "День уже можно считать полезным.", tone: "good" },
    ],
  },
  {
    id: "focus",
    min: 90,
    max: 119,
    tone: "strong",
    phrases: [
      { title: "Сильная сессия", description: "Полтора часа практики — отличный учебный темп.", tone: "strong" },
      { title: "Огонь разгорается", description: "Ты уже хорошо продвинулся сегодня.", tone: "strong" },
      { title: "Глубокий фокус", description: "Похоже, ты вошёл в рабочий поток.", tone: "strong" },
    ],
  },
  {
    id: "battle",
    min: 120,
    max: 179,
    tone: "strong",
    phrases: [
      { title: "Боевой режим", description: "Два часа кодинга — серьёзная работа.", tone: "strong" },
      { title: "Квест выполнен", description: "Сегодня уже есть хороший прогресс.", tone: "strong" },
      { title: "Кодерский марш", description: "Ты держишь темп, который реально прокачивает навык.", tone: "strong" },
    ],
  },
  {
    id: "fire",
    min: 180,
    max: 239,
    tone: "fire",
    phrases: [
      { title: "Пламенный забег", description: "Три часа практики — мощный день.", tone: "fire" },
      { title: "Горячая серия", description: "Сегодня CodeFire горит по-настоящему.", tone: "fire" },
      { title: "Серьёзный прогресс", description: "Такой объём уже заметно двигает тебя вперёд.", tone: "fire" },
    ],
  },
  {
    id: "marathon",
    min: 240,
    max: 359,
    tone: "fire",
    phrases: [
      { title: "Сверхпродуктивный день", description: "Четыре часа кодинга — это уже большой рывок.", tone: "fire" },
      { title: "Огненный марафон", description: "Ты сегодня очень сильно вложился в прокачку.", tone: "fire" },
      { title: "Большой учебный рейд", description: "Много практики, много XP, много движения.", tone: "fire" },
    ],
  },
  {
    id: "legendary",
    min: 360,
    max: Number.POSITIVE_INFINITY,
    tone: "legendary",
    phrases: [
      { title: "Легендарный забег", description: "Шесть часов кодинга — это почти рейд-босс.", tone: "legendary" },
      { title: "Вечное пламя дня", description: "Сегодня ты реально разжёг CodeFire.", tone: "legendary" },
      { title: "Boss fight cleared", description: "Очень мощный день. Не забудь отдохнуть.", tone: "legendary" },
    ],
  },
];

function getDateKey(dateKey = new Date().toISOString().slice(0, 10)) {
  return dateKey.slice(0, 10);
}

function getStableIndex(seed: string, size: number) {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % size;
}

export function getTodayStatus(totalMinutes: number, dateKey?: string): TodayStatus {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const group =
    statusGroups.find(({ min, max }) => safeMinutes >= min && safeMinutes <= max) ??
    statusGroups[0];
  const index = getStableIndex(`${getDateKey(dateKey)}:${group.id}`, group.phrases.length);

  return group.phrases[index];
}
