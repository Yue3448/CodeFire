\# CodeFire context



CodeFire is my private local coding activity dashboard.

Current app structure:

- `/` Overview: lightweight summary only.
- `/profile` Developer Profile, Avatar, equipped items, ranks, records.
- `/analytics` heatmap, charts, weekly report, language/project analytics.
- `/rpg` quests, weekly quests, raids/events, achievements, bosses, Hall of Fame.
- `/inventory` full item grid, filters, unlock progress, effects.
- `/study` study tasks, Stepik, manual study, topics, goals, weekly journal.
- `/focus` isolated Pomodoro timer, settings, stats, history.
- `/journal` notes, before/after reflection, mood/difficulty, notes history.
- `/seasons` active season, season pass, rewards, themes.
- `/timeline` full learning timeline.

Shared app navigation is in `src/components/layout/*`. Desktop uses the sidebar; narrow screens use bottom navigation. Overview must stay lightweight and should not render full inventory, timeline, achievements, or study history.



Stack:

\- Next.js

\- TypeScript

\- Tailwind CSS

\- Recharts

\- WakaTime API



Important:

\- Do not touch .env.local.

\- Do not expose WAKATIME\_API\_KEY to frontend.

\- Do not add fake/mock/demo activity.

\- All XP and activity must come from WakaTime API and valid local history only.

\- XP rule: 1 minute of real coding = 1 XP.

\- Markdown, Text, JSON, YAML, Git Config, TOML, INI, Other should not be treated as main coding languages.



Current systems:

\- Today card

\- XP / levels

\- ranks and rank medals

\- heatmap

\- battle rhythm chart

\- streak

\- daily quests

\- goals

\- weekly report

\- achievements

\- language levels

\- daily note

\- anti-burnout messages

\- yearly GitHub-style heatmap

\- Learning RPG layer:

  \- Coding XP / Adventure XP / Season XP breakdown

  \- Boss Fights

  \- Inventory

  \- Study Tasks

  \- Stepik Practice

  \- Manual Study

  \- Topic Tracker

  \- Daily Difficulty

  \- Light Day / Recovery Mode

  \- Custom Goals

  \- Weekly Study Journal with Markdown export

  \- Day Details / Day Replay

  \- Hall of Fame

  \- Seasons / Season Pass

  \- Unlockable Themes

  \- Developer Profile / Avatar

  \- Learning Timeline



XP boundaries:

\- Coding XP must remain only WakaTime coding time.

\- Adventure XP can come from tasks, notes, bosses, Stepik, manual study and game systems.

\- Season XP is displayed separately and must not silently replace Coding XP.



Local personal JSON files:

\- data/codefire-study-tasks.json

\- data/codefire-topics.json

\- data/codefire-boss-fights.json

\- data/codefire-inventory.json

\- data/codefire-manual-study.json

\- data/codefire-stepik.json

\- data/codefire-seasons.json

\- data/codefire-goals.json

\- data/codefire-timeline.json

\- data/codefire-unlocked-themes.json

\- data/codefire-difficulty.json

\- data/codefire-light-days.json



Known priorities:

\- Keep dark RPG dashboard style.

\- Fix UI carefully, do not rewrite everything.

\- Always run:

&#x20; npm.cmd run typecheck

&#x20; npm.cmd run lint

\- Run build when possible:

&#x20; npm.cmd run build

Part 2 RPG systems:

\- Hall of Fame is built from real records: best day/week/streak, strongest language, rare unlocked inventory, completed bosses, current season, Pomodoro, Stepik and unlocked achievements. No fake trophies.

\- Seasons are stored in `data/codefire-seasons.json`. A season has goals, rewards, `createdAt`, optional `completedAt`, and active state. Season goals can track Coding XP, language XP, tasks, active days, Pomodoro, notes, topic XP and manual study.

\- Season Pass is not monetization. It is a local learning reward track based on Season XP. Season XP is separate from real WakaTime Coding XP and must not replace or mutate Coding XP.

\- Developer Profile is derived from existing data: rank, level, Coding XP, Adventure XP, Season XP, strongest language/topic, streak, best day, achievements, inventory and equipped items.

\- Avatar is a simple RPG card derived from rank stage, level, selected theme and equipped inventory. It does not require generated art.

\- Learning Timeline is stored in `data/codefire-timeline.json`, deduped by stable event identity, and can be grouped by month. Timeline events come from real rank/achievement/item/season/boss/Stepik/note/topic/Pomodoro data.

\- Lightweight dashboard loading uses `/api/overview` first. Heavy analytics/RPG data can be loaded separately through `/api/wakatime`, `/api/analytics`, `/api/timeline`, `/api/achievements`, `/api/journal`, `/api/inventory`, `/api/seasons`, and `/api/pomodoro`.

\- Records are available separately at `/api/records`.

\- Force refresh is available through `/api/overview?refresh=1` and `/api/wakatime?refresh=1`. The frontend refresh button calls the overview refresh path.

\- Server cache must not store secrets. Overview cache TTL is short, full/WakaTime cache TTL is longer. Stale data can be returned with an `X-CodeFire-Cache: STALE` header when WakaTime is unavailable.

\- Development performance logs use labels: `[CodeFire] overview total`, `[CodeFire] wakatime fetch`, `[CodeFire] local json read`, `[CodeFire] derived calculations`, `[CodeFire] achievements`, `[CodeFire] timeline`, `[CodeFire] seasons`, `[CodeFire] heatmap`.

