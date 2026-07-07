# CodeFire

## App structure

CodeFire is no longer organized as one monolithic dashboard screen. The App Router pages are split by product area:

- `/` - lightweight Overview: today summary, progression, rank, current quests/raid, Pomodoro preview, heatmap preview, quick links.
- `/profile` - Developer Profile, Avatar, equipped items, language ranks, records preview.
- `/analytics` - yearly heatmap, XP and hours charts, weekly report, records, language and project analytics.
- `/rpg` - daily/weekly quests, raids/events, achievements preview, boss fights, Adventure XP, Hall of Fame, timeline preview.
- `/inventory` - item grid, equipped slots, locked/unlocked and rarity filters, item progress, Adventure XP effects.
- `/study` - study tasks, Stepik, manual study, topic tracker, custom goals, weekly study journal.
- `/focus` - Pomodoro timer, settings, stats, and recent focus history.
- `/journal` - daily notes, before/after reflection, mood/difficulty, notes history.
- `/seasons` - active season, season goals, season pass, rewards, themes, season history.
- `/timeline` - full learning timeline with event type filters.

Shared navigation lives in `src/components/layout/*`: desktop uses a left sidebar, narrow screens use bottom navigation. Heavy sections are loaded only on their route-specific pages; Overview uses `/api/overview` and does not render full inventory, timeline, achievements, or study history.

Route page components live in `src/components/{overview,profile,analytics,rpg,inventory,study,focus,journal,seasons,timeline}/*-page.tsx`.

Приватный локальный dashboard кодинг-активности в стиле RPG/progression system.

CodeFire берет данные из WakaTime через backend API route Next.js, считает XP по правилу `1 минута кодинга = 1 XP` и показывает личный прогресс: день, уровень, общий опыт, графики и heatmap за последние 30 дней.

## XP, уровни и ранги

XP считается по простой формуле:

```text
1 минута активности WakaTime = 1 XP
```

Числовой уровень считается отдельно:

```text
level = floor(sqrt(totalXP / 100)) + 1
```

Ранг находится поверх уровня и зависит от общего XP. В Progression card отображаются текущий уровень, текущий ранг, медаль ранга, общий XP, прогресс до следующего уровня и отдельный прогресс до следующего ранга.

### Ранги

| XP | Ранг |
| ---: | --- |
| 0 | Искра |
| 100 | Ученик костра |
| 250 | Новичок кода |
| 500 | Подмастерье |
| 1000 | Железный кодер |
| 2000 | Бронзовый разработчик |
| 3500 | Серебряный разработчик |
| 5000 | Золотой разработчик |
| 7500 | Пламенный инженер |
| 10000 | Изумрудный инженер |
| 15000 | Алмазный инженер |
| 22000 | Архитектор пламени |
| 30000 | Легенда CodeFire |
| 45000 | Мифический разработчик |
| 60000 | Вечное пламя |

## Главный язык

Главный язык кодинга выбирается по максимальному времени за сегодня, но из выбора исключаются Markdown и конфиги:

```text
Markdown, JSON, YAML, Text, Git Config, TOML, INI, Other
```

Если после фильтрации не осталось языков программирования, CodeFire показывает `Нет кода`. Общие часы и XP при этом все равно считаются по всей активности WakaTime.

Для главного языка используется локальный mapping иконок в `src/lib/language-icons.ts`. Поддерживаются Python, TypeScript, JavaScript, HTML, CSS, JSON, Markdown, Bash, PowerShell, C++, C, Java, Go, Rust, SQL, Docker, YAML и Other.

## Стек

- Next.js
- TypeScript
- Tailwind CSS
- Recharts
- WakaTime API

## Как получить WakaTime API key

1. Войди в WakaTime.
2. Открой страницу API key: [https://wakatime.com/settings/api-key](https://wakatime.com/settings/api-key)
3. Скопируй свой Secret API Key.
4. Не вставляй ключ в frontend-код и не коммить `.env.local`.

## Настройка `.env.local`

Создай файл `.env.local` в корне проекта:

```bash
WAKATIME_API_KEY=waka_your_api_key_here
```

Можно начать с примера:

```bash
cp .env.example .env.local
```

На Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## Локальный запуск

Установи зависимости:

```bash
npm install
```

Запусти dev-сервер:

```bash
npm run dev
```

Если PowerShell на Windows блокирует `npm.ps1`, используй:

```powershell
npm.cmd run dev
```

Открой dashboard:

```text
http://localhost:3000
```

Если `WAKATIME_API_KEY` не задан, CodeFire покажет понятное состояние настройки вместо падения.

## Проверки

```bash
npm run typecheck
npm run lint
npm run build
```

## Деплой на Vercel без раскрытия API key

1. Импортируй проект в Vercel.
2. В настройках проекта открой `Settings -> Environment Variables`.
3. Добавь переменную:

```text
WAKATIME_API_KEY=waka_your_api_key_here
```

4. Не добавляй префикс `NEXT_PUBLIC_`: переменная должна оставаться доступной только серверному коду.
5. Задеплой проект.

В CodeFire frontend обращается только к `/api/wakatime`; сам WakaTime API key читается на сервере из `process.env.WAKATIME_API_KEY`.

## Learning RPG layer

CodeFire now has a separate learning RPG layer. It is intentionally separated from honest WakaTime Coding XP.

XP types:

```text
Coding XP    = only WakaTime coding minutes, 1 minute = 1 XP
Adventure XP = study tasks, Stepik entries, manual study, notes, boss rewards
Season XP    = separate season progress, currently Coding XP + Adventure XP
```

Coding XP still drives the global level and global rank. Adventure XP and Season XP are shown as game progression and do not silently change WakaTime XP.

MVP systems included:

- Boss Fights with presets, requirements, progress and item rewards.
- Inventory with unlock/equip state and RPG rarity.
- Study Tasks, Stepik Practice and Manual Study journals.
- Topic Tracker with topic XP, levels, confidence and review hints.
- Daily Difficulty and Light Day / Recovery state.
- Custom Goals.
- Weekly Study Journal with Markdown export.
- Day Details and Day Replay from the yearly heatmap.
- Extended Records and Hall of Fame.
- Seasons and Season Pass.
- Unlockable Themes preview.
- Developer Profile and Avatar stage.
- Learning Timeline.
- Dashboard period filter: today, 7d, 30d, 365d, all.

Local personal data files:

```text
data/codefire-study-tasks.json
data/codefire-topics.json
data/codefire-boss-fights.json
data/codefire-inventory.json
data/codefire-manual-study.json
data/codefire-stepik.json
data/codefire-seasons.json
data/codefire-goals.json
data/codefire-timeline.json
data/codefire-unlocked-themes.json
data/codefire-difficulty.json
data/codefire-light-days.json
```

These files are ignored by git because they contain personal local progress.
