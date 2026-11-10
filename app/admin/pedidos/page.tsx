"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  MapPin,
  RefreshCw,
} from "lucide-react";

type Order = {
  id: string;
  status: string;
  payment_status: string;
  items: { name: string; quantity: number; lineTotal: number }[];
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
    complement?: string;
  };
  scheduled_for: string;
  subtotal: number;
  total: number;
  created_at: string;
  history: { status: string; note: string; at: string }[];
  customer_name: string;
  customer_email: string;
};
const statusLabels: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pending: "Aguardando aprovação",
  approved: "Aprovado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entrega concluída",
  cancelled: "Cancelado",
};
const paymentLabels: Record<string, string> = {
  pending: "Pendente",
  in_process: "Em análise",
  approved: "Pago",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Parcialmente reembolsado",
  charged_back: "Contestado",
  checkout_failed: "Falha ao iniciar pagamento",
  preference_failed: "Falha ao gerar pagamento",
  not_required: "Pedido anterior à integração",
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders(data.orders);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível carregar pedidos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const update = async (
    id: string,
    status: "approved" | "cancelled" | "out_for_delivery",
  ) => {
    setMessage("");
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        status === "approved"
          ? "Pedido aprovado."
          : status === "cancelled"
            ? "Pedido cancelado."
            : "Pedido marcado como saiu para entrega.",
      );
      await load();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível atualizar.",
      );
    }
  };
  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#279236]"
            >
              <ArrowLeft className="h-4 w-4" /> Painel administrativo
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Pedidos recebidos
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Revise os itens, o endereço e o horário antes de aprovar.
            </p>
          </div>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        </div>
        {message && (
          <p className="mt-4 rounded-lg bg-[#279236]/5 p-3 text-sm text-[#1f7a2b]">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
            {error.includes("restrito") && (
              <>
                {" "}
                <Link href="/login?next=/admin/pedidos" className="underline">
                  Entrar como admin
                </Link>
              </>
            )}
          </p>
        )}
        {loading ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Carregando pedidos...
          </p>
        ) : orders.length === 0 ? (
          <p className="mt-6 rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Nenhum pedido recebido até agora.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((order) => {
              const isOpen = expanded.includes(order.id);
              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggle(order.id)}
                    aria-expanded={isOpen}
                    className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left ${isOpen ? "border-b border-gray-100" : ""}`}
                  >
                    <div>
                      <p className="font-bold text-gray-900">
                        {order.customer_name}{" "}
                        <span className="font-normal text-gray-500">
                          · {order.customer_email}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === "cancelled" ? "bg-red-50 text-red-700" : order.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <>
                      <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-gray-500">
                            Itens
                          </p>
                          <ul className="mt-2 space-y-1">
                            {order.items.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700">
                                {item.quantity}× {item.name}{" "}
                                <span className="text-gray-500">
                                  {money.format(Number(item.lineTotal))}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-base font-extrabold text-gray-900">
                            Total: {money.format(Number(order.total))}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                            <MapPin className="h-4 w-4" />
                            Entrega
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            {order.address.street}, {order.address.number}
                            {order.address.complement
                              ? `, ${order.address.complement}`
                              : ""}
                            <br />
                            {order.address.neighborhood} · {order.address.city}/
                            {order.address.state} · {order.address.cep}
                          </p>
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500">
                            <Clock3 className="h-4 w-4" />
                            Agendado para
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            {new Date(order.scheduled_for).toLocaleString(
                              "pt-BR",
                              { dateStyle: "long", timeStyle: "short" },
                            )}
                          </p>
                          <p className="mt-3 text-xs text-gray-500">
                            Pagamento: {paymentLabels[order.payment_status] ?? order.payment_status}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Histórico:{" "}
                            {order.history
                              .map((entry) => entry.note)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      {(order.status === "pending_payment" || order.status === "pending") && (
                        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 pb-5 pt-4">
                          <button
                            onClick={() => void update(order.id, "cancelled")}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Cancelar pedido
                          </button>
                          {order.status === "pending" && ["approved", "not_required"].includes(order.payment_status) && (
                            <button
                              onClick={() => void update(order.id, "approved")}
                              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              Aprovar pedido
                            </button>
                          )}
                        </div>
                      )}
                      {order.status === "approved" && (
                        <div className="flex justify-end border-t border-gray-100 px-5 pb-5 pt-4">
                          <button
                            onClick={() =>
                              void update(order.id, "out_for_delivery")
                            }
                            className="rounded-lg bg-[#279236] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f7a2b]"
                          >
                            Marcar saiu para entrega
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
