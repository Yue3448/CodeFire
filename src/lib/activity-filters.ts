export const EXCLUDED_LANGUAGES = [
  "Markdown",
  "JSON",
  "YAML",
  "Text",
  "Git Config",
  "TOML",
  "INI",
  "Other",
  "Text only",
  "GitIgnore file",
  "TSConfig",
];

export const EXCLUDED_CATEGORIES = [
  "Browsing",
  "Reading",
  "Writing",
  "Notes",
  "Documentation",
];

const excludedLanguageKeys = new Set(EXCLUDED_LANGUAGES.map(normalizeActivityKey));
const excludedCategoryKeys = new Set(EXCLUDED_CATEGORIES.map(normalizeActivityKey));

export function normalizeActivityKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isExcludedLanguage(language: string) {
  const key = normalizeActivityKey(language);

  return (
    excludedLanguageKeys.has(key) ||
    key.includes("markdown") ||
    key.includes("config") ||
    key.includes("ignore file")
  );
}

export function isExcludedCategory(category: string) {
  return excludedCategoryKeys.has(normalizeActivityKey(category));
}
