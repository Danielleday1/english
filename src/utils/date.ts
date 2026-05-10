export function getLocalDateKey(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function formatLongDate(dateString: string): string {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(`${dateString}T12:00:00`));
}

export function formatShortDate(dateString: string): string {
  if (!dateString) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(`${dateString}T12:00:00`));
}

export function isSameMonth(dateString: string, target = new Date()): boolean {
  const date = new Date(`${dateString}T12:00:00`);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}

export function startOfWeek(date = new Date()): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function isWithinDays(dateString: string, days: number): boolean {
  const target = new Date(`${dateString}T12:00:00`);
  const now = new Date();
  const diff = now.getTime() - target.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

export function minutesToLabel(minutes: number): string {
  if (minutes <= 0) {
    return "0 分钟";
  }

  if (minutes < 60) {
    return `${minutes} 分钟`;
  }

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain === 0 ? `${hours} 小时` : `${hours} 小时 ${remain} 分钟`;
}
