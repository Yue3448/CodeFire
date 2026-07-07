import {
  Backpack,
  BarChart3,
  BookOpen,
  CalendarDays,
  Home,
  NotebookPen,
  Route,
  Sword,
  Timer,
  User,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Overview", shortLabel: "Home", icon: Home },
  { href: "/profile", label: "Profile", shortLabel: "Profile", icon: User },
  { href: "/analytics", label: "Analytics", shortLabel: "Stats", icon: BarChart3 },
  { href: "/rpg", label: "RPG", shortLabel: "RPG", icon: Sword },
  { href: "/inventory", label: "Inventory", shortLabel: "Items", icon: Backpack },
  { href: "/study", label: "Study", shortLabel: "Study", icon: BookOpen },
  { href: "/focus", label: "Focus", shortLabel: "Focus", icon: Timer },
  { href: "/journal", label: "Journal", shortLabel: "Journal", icon: NotebookPen },
  { href: "/seasons", label: "Seasons", shortLabel: "Seasons", icon: CalendarDays },
  { href: "/timeline", label: "Timeline", shortLabel: "Path", icon: Route },
] as const;
