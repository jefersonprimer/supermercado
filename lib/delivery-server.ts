import { query } from "@/lib/db";
import { DEFAULT_DELIVERY_FEE } from "@/lib/delivery";
import {
  DEFAULT_STORE_SCHEDULE,
  type StoreSchedule,
} from "@/lib/store-hours";

async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.store_settings (
      key VARCHAR(80) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function getDeliveryFee() {
  await ensureSettingsTable();
  const rows = await query<{ value: string }>(
    "SELECT value FROM public.store_settings WHERE key = $1",
    ["delivery_fee"],
  );
  if (!rows.length) return DEFAULT_DELIVERY_FEE;
  const fee = Number(rows[0].value);
  return Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_DELIVERY_FEE;
}

export async function setDeliveryFee(fee: number) {
  await ensureSettingsTable();
  await query(
    `INSERT INTO public.store_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    ["delivery_fee", String(fee)],
  );
}

export async function getStoreSchedule(): Promise<StoreSchedule> {
  await ensureSettingsTable();
  const rows = await query<{ value: string }>(
    "SELECT value FROM public.store_settings WHERE key = $1",
    ["store_schedule"],
  );
  if (!rows.length) return DEFAULT_STORE_SCHEDULE;
  try {
    const value = JSON.parse(rows[0].value) as Partial<StoreSchedule> & {
      opensAt?: string;
      closesAt?: string;
    };
    if (!Array.isArray(value.openDays) || typeof value.maxAdvanceDays !== "number") {
      return DEFAULT_STORE_SCHEDULE;
    }
    const intervals = Array.isArray(value.intervals)
      ? value.intervals
      : value.opensAt && value.closesAt
        ? [{ opensAt: value.opensAt, closesAt: value.closesAt }]
        : DEFAULT_STORE_SCHEDULE.intervals;
    return { openDays: value.openDays, intervals, maxAdvanceDays: value.maxAdvanceDays };
  } catch {
    return DEFAULT_STORE_SCHEDULE;
  }
}

export async function setStoreSchedule(schedule: StoreSchedule) {
  await ensureSettingsTable();
  await query(
    `INSERT INTO public.store_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    ["store_schedule", JSON.stringify(schedule)],
  );
}
