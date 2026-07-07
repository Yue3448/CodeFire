export function formatHours(seconds: number) {
  const safeSeconds = Math.max(seconds, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}м`;
  }

  return `${hours}ч ${minutes}м`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

export function formatCompactHours(seconds: number) {
  const hours = seconds / 3600;
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: hours >= 10 ? 0 : 1,
  }).format(hours);
}
