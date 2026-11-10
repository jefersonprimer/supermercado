import { cookies, headers } from "next/headers";
import { query } from "@/lib/db";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const requestHeaders = await headers();
    const bearerToken = requestHeaders.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
    const cookieStore = await cookies();
    const sessionToken = bearerToken ?? cookieStore.get("fanfar_session")?.value;

    if (!sessionToken) return null;

    const rows = await query<SessionUser>(
      `SELECT u.id, u.name, u.email, u.role
       FROM public.sessions s
       JOIN public.users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()
       LIMIT 1`,
      [sessionToken]
    );

    return rows[0] ?? null;
  } catch (error) {
    console.error("Erro ao verificar usuário da sessão:", error);
    return null;
  }
}
