import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureCandidatesSchema } from "@/lib/candidates";

const maritalStatuses = new Set(["Casado(a)", "Solteiro(a)", "União estável"]);
const educationLevels = new Set([
  "Ensino fundamental incompleto",
  "Ensino fundamental completo",
  "Ensino médio incompleto",
  "Ensino médio completo",
  "Ensino superior incompleto",
  "Ensino superior completo",
  "Pós-graduação",
]);
const positions = new Set([
  "Açougueiro(a)",
  "Operador(a) de caixa",
  "Empacotador(a)",
  "Recepcionista",
  "Repositor(a)",
  "Padeiro(a)",
  "Confeiteiro(a)",
  "Produção de salgados (padaria)",
  "Atendente da padaria",
  "Repositor da fruteira",
  "Administrativo",
  "Marketing/Comunicação",
  "Motorista",
  "Limpeza",
  "Outro",
]);
const shifts = new Set([
  "Manhã (segunda a sábado)",
  "Tarde (segunda a sábado)",
  "Manhã e tarde (segunda a sábado)",
]);

function isText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isCloudinaryCandidatePhoto(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      url.pathname.includes("/image/upload/") &&
      url.pathname.includes("/job-applications/");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Os dados da candidatura são inválidos." }, { status: 400 });
    }
    const {
      fullName,
      photoUrl,
      birthDate,
      currentAddress,
      email,
      phone,
      maritalStatus,
      hasChildren,
      childrenCount,
      previousJobs,
      previousDislikes,
      education,
      teamworkResponse,
      skills,
      interestedPositions,
      otherPosition,
      workShifts,
    } = body;

    const parsedBirthDate = typeof birthDate === "string" ? new Date(`${birthDate}T00:00:00Z`) : null;
    const validBirthDate = parsedBirthDate &&
      !Number.isNaN(parsedBirthDate.getTime()) &&
      parsedBirthDate.toISOString().slice(0, 10) === birthDate &&
      parsedBirthDate.getTime() < Date.now();
    const validChildrenCount = !hasChildren
      ? childrenCount === null || childrenCount === ""
      : Number.isInteger(Number(childrenCount)) && Number(childrenCount) >= 1 && Number(childrenCount) <= 30;
    const validPositions = Array.isArray(interestedPositions) &&
      interestedPositions.length > 0 &&
      interestedPositions.length <= positions.size &&
      interestedPositions.every((position: unknown) => typeof position === "string" && positions.has(position)) &&
      new Set(interestedPositions).size === interestedPositions.length;
    const validShifts = Array.isArray(workShifts) &&
      workShifts.length > 0 &&
      workShifts.length <= shifts.size &&
      workShifts.every((shift: unknown) => typeof shift === "string" && shifts.has(shift)) &&
      new Set(workShifts).size === workShifts.length;

    if (
      !isText(fullName, 200) ||
      (photoUrl && !isCloudinaryCandidatePhoto(photoUrl)) ||
      !validBirthDate ||
      !isText(currentAddress, 500) ||
      !isText(email, 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      !isText(phone, 40) ||
      !maritalStatuses.has(maritalStatus) ||
      typeof hasChildren !== "boolean" ||
      !validChildrenCount ||
      !isText(previousJobs, 5000) ||
      !isText(previousDislikes, 3000) ||
      !educationLevels.has(education) ||
      !isText(teamworkResponse, 3000) ||
      !isText(skills, 3000) ||
      !validPositions ||
      (interestedPositions.includes("Outro") && !isText(otherPosition, 120)) ||
      !validShifts
    ) {
      return NextResponse.json({ error: "Confira os campos obrigatórios e tente novamente." }, { status: 400 });
    }

    await ensureCandidatesSchema();
    const rows = await query<{ id: string }>(
      `INSERT INTO public.job_applications (
        full_name, photo_url, birth_date, current_address, email, phone,
        marital_status, has_children, children_count, previous_jobs,
        previous_dislikes, education, teamwork_response, skills,
        interested_positions, other_position, work_shifts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15::text[], $16, $17::text[]
      ) RETURNING id`,
      [
        fullName.trim(),
        photoUrl || null,
        birthDate,
        currentAddress.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        maritalStatus,
        hasChildren,
        hasChildren ? Number(childrenCount) : null,
        previousJobs.trim(),
        previousDislikes.trim(),
        education,
        teamworkResponse.trim(),
        skills.trim(),
        interestedPositions,
        interestedPositions.includes("Outro") ? otherPosition.trim() : null,
        workShifts,
      ],
    );

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar candidatura:", error);
    return NextResponse.json({ error: "Não foi possível enviar sua candidatura agora." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    await ensureCandidatesSchema();
    const applications = await query(
      `SELECT * FROM public.job_applications ORDER BY created_at DESC`,
    );
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Erro ao buscar candidaturas:", error);
    return NextResponse.json({ error: "Não foi possível carregar as candidaturas." }, { status: 500 });
  }
}

