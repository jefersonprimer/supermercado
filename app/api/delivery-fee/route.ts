import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDeliveryFee, setDeliveryFee } from "@/lib/delivery-server";

export async function GET() {
  try {
    return NextResponse.json({ fee: await getDeliveryFee() });
  } catch (error) {
    console.error("Erro ao buscar taxa de entrega:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a taxa de entrega." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem alterar a taxa." }, { status: 403 });
  }

  try {
    const { fee } = await request.json();
    const amount = Number(fee);
    if (!Number.isFinite(amount) || amount < 0 || amount > 10000) {
      return NextResponse.json({ error: "Informe uma taxa entre R$ 0,00 e R$ 10.000,00." }, { status: 400 });
    }
    await setDeliveryFee(Math.round(amount * 100) / 100);
    return NextResponse.json({ fee: Math.round(amount * 100) / 100 });
  } catch (error) {
    console.error("Erro ao atualizar taxa de entrega:", error);
    return NextResponse.json({ error: "Não foi possível salvar a taxa de entrega." }, { status: 500 });
  }
}
