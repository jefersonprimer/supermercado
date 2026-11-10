"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

type SacMessage = {
  id: string;
  type: "Sugestão" | "Reclamação";
  full_name: string;
  email: string;
  phone: string | null;
  order_number: string | null;
  message: string;
  created_at: string;
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function AdminSacPage() {
  const [messages, setMessages] = useState<SacMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sac", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar as mensagens.");
      setMessages(data.messages);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as mensagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <main className="min-h-screen flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#C10000]">
              <ArrowLeft className="h-4 w-4" /> Painel administrativo
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">Mensagens do SAC</h1>
            <p className="mt-1 text-sm text-gray-500">Sugestões e reclamações enviadas pela loja.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
            {error.includes("administradores") && <p className="mt-2"><Link className="font-semibold underline" href="/login?next=/admin/sac">Entrar como administrador</Link></p>}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-500">Carregando mensagens...</p>
        ) : !error && messages.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Nenhuma mensagem recebida até agora.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {messages.map((item) => (
              <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${item.type === "Reclamação" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                      {item.type}
                    </span>
                    <h2 className="mt-2 text-base font-bold text-gray-900">{item.full_name}</h2>
                  </div>
                  <time className="text-xs text-gray-500" dateTime={item.created_at}>{dateTimeFormat.format(new Date(item.created_at))}</time>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                  <a href={`mailto:${item.email}`} className="break-all hover:text-[#C10000]">{item.email}</a>
                  {item.phone && <a href={`tel:${item.phone.replace(/\D/g, "")}`} className="hover:text-[#C10000]">{item.phone}</a>}
                  {item.order_number && <span>Pedido: {item.order_number}</span>}
                </div>
                <p className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">{item.message}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
