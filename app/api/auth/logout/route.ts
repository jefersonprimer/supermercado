import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("fanfar_session")?.value;

    if (sessionToken) {
      await query("DELETE FROM public.sessions WHERE token = $1", [sessionToken]);
    }

    const response = NextResponse.json({ message: "Desconectado com sucesso." });
    response.cookies.delete("fanfar_session");
    return response;
  } catch (error: any) {
    console.error("Erro ao fazer logout:", error);
    return NextResponse.json({ error: "Erro ao sair." }, { status: 500 });
  }
}
