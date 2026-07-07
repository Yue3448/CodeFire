export type LanguageIcon = {
  name: string;
  mark: string;
  shortLabel: string;
  imageSrc?: string;
  foreground: string;
  background: string;
  borderColor: string;
  shadowColor: string;
};

const fallbackIcon: LanguageIcon = {
  name: "Other",
  mark: "◇",
  shortLabel: "OT",
  foreground: "#e5e7eb",
  background: "linear-gradient(135deg, #27272a, #52525b)",
  borderColor: "rgba(228, 228, 231, 0.28)",
  shadowColor: "rgba(228, 228, 231, 0.18)",
};

const noCodeIcon: LanguageIcon = {
  name: "Нет кода",
  mark: "∅",
  shortLabel: "NO",
  foreground: "#a1a1aa",
  background: "linear-gradient(135deg, #18181b, #3f3f46)",
  borderColor: "rgba(161, 161, 170, 0.24)",
  shadowColor: "rgba(161, 161, 170, 0.16)",
};

const languageIcons: Record<string, LanguageIcon> = {
  python: {
    name: "Python",
    mark: "Py",
    shortLabel: "PY",
    imageSrc: "/languages/python_logo_clean.png",
    foreground: "#ffe873",
    background: "linear-gradient(135deg, #3776ab 0%, #1f4f7a 48%, #ffd343 100%)",
    borderColor: "rgba(255, 211, 67, 0.38)",
    shadowColor: "rgba(55, 118, 171, 0.44)",
  },
  typescript: {
    name: "TypeScript",
    mark: "TS",
    shortLabel: "TS",
    foreground: "#ffffff",
    background: "linear-gradient(135deg, #3178c6, #235a97)",
    borderColor: "rgba(49, 120, 198, 0.42)",
    shadowColor: "rgba(49, 120, 198, 0.42)",
  },
  javascript: {
    name: "JavaScript",
    mark: "JS",
    shortLabel: "JS",
    foreground: "#111827",
    background: "linear-gradient(135deg, #f7df1e, #facc15)",
    borderColor: "rgba(247, 223, 30, 0.44)",
    shadowColor: "rgba(247, 223, 30, 0.36)",
  },
  html: {
    name: "HTML",
    mark: "5",
    shortLabel: "HTML",
    foreground: "#fff7ed",
    background: "linear-gradient(135deg, #e34f26, #f97316)",
    borderColor: "rgba(227, 79, 38, 0.42)",
    shadowColor: "rgba(227, 79, 38, 0.36)",
  },
  css: {
    name: "CSS",
    mark: "3",
    shortLabel: "CSS",
    foreground: "#eff6ff",
    background: "linear-gradient(135deg, #1572b6, #38bdf8)",
    borderColor: "rgba(56, 189, 248, 0.42)",
    shadowColor: "rgba(21, 114, 182, 0.38)",
  },
  json: {
    name: "JSON",
    mark: "{}",
    shortLabel: "JSON",
    foreground: "#f8fafc",
    background: "linear-gradient(135deg, #334155, #f59e0b)",
    borderColor: "rgba(245, 158, 11, 0.32)",
    shadowColor: "rgba(245, 158, 11, 0.22)",
  },
  markdown: {
    name: "Markdown",
    mark: "MD",
    shortLabel: "MD",
    foreground: "#f8fafc",
    background: "linear-gradient(135deg, #111827, #64748b)",
    borderColor: "rgba(148, 163, 184, 0.28)",
    shadowColor: "rgba(148, 163, 184, 0.18)",
  },
  bash: {
    name: "Bash",
    mark: "$",
    shortLabel: "SH",
    foreground: "#d9f99d",
    background: "linear-gradient(135deg, #111827, #16a34a)",
    borderColor: "rgba(34, 197, 94, 0.34)",
    shadowColor: "rgba(34, 197, 94, 0.28)",
  },
  powershell: {
    name: "PowerShell",
    mark: ">_",
    shortLabel: "PS",
    foreground: "#e0f2fe",
    background: "linear-gradient(135deg, #2563eb, #0f172a)",
    borderColor: "rgba(96, 165, 250, 0.38)",
    shadowColor: "rgba(37, 99, 235, 0.32)",
  },
  "c++": {
    name: "C++",
    mark: "C++",
    shortLabel: "C++",
    foreground: "#eff6ff",
    background: "linear-gradient(135deg, #00599c, #60a5fa)",
    borderColor: "rgba(96, 165, 250, 0.4)",
    shadowColor: "rgba(0, 89, 156, 0.36)",
  },
  c: {
    name: "C",
    mark: "C",
    shortLabel: "C",
    foreground: "#eff6ff",
    background: "linear-gradient(135deg, #283593, #5c6bc0)",
    borderColor: "rgba(92, 107, 192, 0.4)",
    shadowColor: "rgba(40, 53, 147, 0.32)",
  },
  java: {
    name: "Java",
    mark: "J",
    shortLabel: "JAVA",
    foreground: "#fff7ed",
    background: "linear-gradient(135deg, #e11d48, #f97316)",
    borderColor: "rgba(249, 115, 22, 0.38)",
    shadowColor: "rgba(225, 29, 72, 0.32)",
  },
  go: {
    name: "Go",
    mark: "Go",
    shortLabel: "GO",
    foreground: "#ecfeff",
    background: "linear-gradient(135deg, #00add8, #22d3ee)",
    borderColor: "rgba(34, 211, 238, 0.42)",
    shadowColor: "rgba(0, 173, 216, 0.38)",
  },
  rust: {
    name: "Rust",
    mark: "Rs",
    shortLabel: "RS",
    foreground: "#fff7ed",
    background: "linear-gradient(135deg, #7c2d12, #ea580c)",
    borderColor: "rgba(234, 88, 12, 0.36)",
    shadowColor: "rgba(124, 45, 18, 0.34)",
  },
  sql: {
    name: "SQL",
    mark: "DB",
    shortLabel: "SQL",
    foreground: "#ecfeff",
    background: "linear-gradient(135deg, #0f766e, #14b8a6)",
    borderColor: "rgba(20, 184, 166, 0.38)",
    shadowColor: "rgba(20, 184, 166, 0.3)",
  },
  docker: {
    name: "Docker",
    mark: "D",
    shortLabel: "DOCKER",
    foreground: "#eff6ff",
    background: "linear-gradient(135deg, #1d63ed, #38bdf8)",
    borderColor: "rgba(56, 189, 248, 0.4)",
    shadowColor: "rgba(29, 99, 237, 0.34)",
  },
  yaml: {
    name: "YAML",
    mark: "Y",
    shortLabel: "YAML",
    foreground: "#fef2f2",
    background: "linear-gradient(135deg, #991b1b, #f97316)",
    borderColor: "rgba(249, 115, 22, 0.32)",
    shadowColor: "rgba(153, 27, 27, 0.26)",
  },
  other: fallbackIcon,
};

const aliases: Record<string, string> = {
  "bourne again shell": "bash",
  shell: "bash",
  sh: "bash",
  zsh: "bash",
  tsx: "typescript",
  jsx: "javascript",
  "c#": "c",
  "c sharp": "c",
  cpp: "c++",
  "objective-c": "c",
  "dockerfile": "docker",
  "postgresql": "sql",
  "mysql": "sql",
  "text only": "other",
  "git config": "other",
  "нет кода": "no-code",
};

function normalizeLanguageName(language: string) {
  const key = language.trim().toLowerCase();
  return aliases[key] ?? key;
}

export function getLanguageIcon(language: string): LanguageIcon {
  const key = normalizeLanguageName(language);

  if (key === "no-code") {
    return noCodeIcon;
  }

  return languageIcons[key] ?? fallbackIcon;
}
