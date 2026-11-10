import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const sessionToken = bearerToken ?? request.cookies.get("fanfar_session")?.value;

  try {
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.role
       FROM public.sessions s
       JOIN public.users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [sessionToken]
    );

    if (rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (error: any) {
    console.error("Erro ao verificar sessão do usuário:", error);
    return NextResponse.json({ user: null });
  }
}
