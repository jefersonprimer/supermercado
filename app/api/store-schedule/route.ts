import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSchedule, setStoreSchedule } from "@/lib/delivery-server";
import { WEEK_DAYS, type StoreSchedule } from "@/lib/store-hours";

export async function GET() {
  try {
    return NextResponse.json({ schedule: await getStoreSchedule() });
  } catch (error) {
    console.error("Erro ao buscar horário da loja:", error);
    return NextResponse.json({ error: "Não foi possível carregar o horário da loja." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem alterar o horário da loja." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as StoreSchedule;
    const submittedDays = Array.isArray(body?.openDays) ? body.openDays : [];
    const openDays = [...new Set(submittedDays)];
    const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
    const intervals = Array.isArray(body?.intervals) ? body.intervals : [];
    const validIntervals = intervals.length > 0 && intervals.length <= 4 && intervals.every(
      (interval) => interval && validTime(interval.opensAt) && validTime(interval.closesAt) && interval.opensAt < interval.closesAt,
    );
    const sortedIntervals = validIntervals
      ? [...intervals].sort((a, b) => a.opensAt.localeCompare(b.opensAt))
      : [];
    const intervalsDoNotOverlap = validIntervals && sortedIntervals.every(
      (interval, index) => index === 0 || sortedIntervals[index - 1].closesAt <= interval.opensAt,
    );
    if (
      !Array.isArray(body.openDays) ||
      openDays.some((day) => !WEEK_DAYS.some((validDay) => validDay.value === day)) ||
      !validIntervals ||
      !intervalsDoNotOverlap ||
      !Number.isInteger(body.maxAdvanceDays) ||
      body.maxAdvanceDays < 1 ||
      body.maxAdvanceDays > 365
    ) {
      return NextResponse.json({ error: "Confira os dias, horários e limite de agendamento." }, { status: 400 });
    }
    const schedule = { ...body, openDays, intervals: sortedIntervals };
    await setStoreSchedule(schedule);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Erro ao atualizar horário da loja:", error);
    return NextResponse.json({ error: "Não foi possível salvar o horário da loja." }, { status: 500 });
  }
}
