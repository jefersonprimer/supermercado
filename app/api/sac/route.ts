import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ensureSacSchema } from "@/lib/sac";

const messageTypes = new Set(["Sugestão", "Reclamação"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Confira os dados e tente novamente." }, { status: 400 });
    }

    const { type, fullName, email, phone, orderNumber, message, website } = body;
    // Campo invisível para descartar envios automáticos simples.
    if (typeof website === "string" && website.trim()) {
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const validName = typeof fullName === "string" && fullName.trim().length > 0 && fullName.trim().length <= 200;
    const validEmail = typeof email === "string" && email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const validPhone = phone === "" || phone === null || phone === undefined || (typeof phone === "string" && phone.trim().length <= 40);
    const validOrderNumber = orderNumber === "" || orderNumber === null || orderNumber === undefined || (typeof orderNumber === "string" && orderNumber.trim().length <= 100);
    const validMessage = typeof message === "string" && message.trim().length >= 10 && message.trim().length <= 5000;

    if (!messageTypes.has(type) || !validName || !validEmail || !validPhone || !validOrderNumber || !validMessage) {
      return NextResponse.json({ error: "Preencha os campos obrigatórios corretamente. A mensagem deve ter entre 10 e 5.000 caracteres." }, { status: 400 });
    }

    await ensureSacSchema();
    const rows = await query<{ id: string }>(
      `INSERT INTO public.sac_messages (type, full_name, email, phone, order_number, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [type, fullName.trim(), email.trim().toLowerCase(), phone?.trim() || null, orderNumber?.trim() || null, message.trim()],
    );

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar mensagem do SAC:", error);
    return NextResponse.json({ error: "Não foi possível enviar sua mensagem agora." }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  try {
    await ensureSacSchema();
    const messages = await query(
      `SELECT * FROM public.sac_messages ORDER BY created_at DESC`,
    );
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Erro ao carregar mensagens do SAC:", error);
    return NextResponse.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });
  }
}
