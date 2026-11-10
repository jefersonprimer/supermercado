export const STORE_TIME_ZONE = "America/Sao_Paulo";
export const WEEK_DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
] as const;

export interface StoreSchedule {
  openDays: number[];
  intervals: { opensAt: string; closesAt: string }[];
  maxAdvanceDays: number;
}

export const DEFAULT_STORE_SCHEDULE: StoreSchedule = {
  openDays: [1, 2, 3, 4, 5, 6],
  intervals: [{ opensAt: "09:00", closesAt: "18:00" }],
  maxAdvanceDays: 30,
};

function storeDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dayByName: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: dayByName[values.weekday] ?? -1,
    time: `${values.hour}:${values.minute}`,
  };
}

export function getScheduleError(
  value: string | Date,
  schedule: StoreSchedule,
  now = new Date(),
) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Escolha uma data e horário válidos.";
  if (date.getTime() < now.getTime() + 30 * 60 * 1000) {
    return "Escolha um horário com pelo menos 30 minutos de antecedência.";
  }
  if (date.getTime() > now.getTime() + schedule.maxAdvanceDays * 86_400_000) {
    return `Os pedidos podem ser agendados com até ${schedule.maxAdvanceDays} dias de antecedência.`;
  }

  const { day, time } = storeDateParts(date);
  if (!schedule.openDays.includes(day)) {
    const label = WEEK_DAYS.find((item) => item.value === day)?.label ?? "Nesse dia";
    return `A loja fica fechada nesse dia (${label.toLowerCase()}). Escolha outro dia.`;
  }
  const insideInterval = schedule.intervals.some(
    (interval) => time >= interval.opensAt && time < interval.closesAt,
  );
  if (!insideInterval) {
    const hours = schedule.intervals
      .map((interval) => `${interval.opensAt} às ${interval.closesAt}`)
      .join(" e ");
    return `A loja funciona ${hours}. Escolha um horário dentro desses períodos.`;
  }
  return null;
}

export function describeStoreHours(schedule: StoreSchedule) {
  const days = WEEK_DAYS.filter((day) => schedule.openDays.includes(day.value)).map(
    (day) => day.label,
  );
  if (!days.length) return "A loja está fechada todos os dias.";
  const hours = schedule.intervals
    .map((interval) => `${interval.opensAt} às ${interval.closesAt}`)
    .join(" e ");
  return `${days.join(", ")}: ${hours}.`;
}
