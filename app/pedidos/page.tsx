"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  PackageCheck,
  Clock3,
  MapPin,
} from "lucide-react";

type Order = {
  id: string;
  status: string;
  payment_status: string;
  payment_url?: string | null;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
  scheduled_for: string;
  subtotal: number;
  total: number;
  created_at: string;
  history: { status: string; note: string; at: string }[];
};
const labels: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  pending: "Aguardando aprovação",
  approved: "Pedido aprovado",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entrega concluída",
  cancelled: "Pedido cancelado",
  payment_pending: "Pagamento pendente",
  payment_in_process: "Pagamento em análise",
  payment_approved: "Pagamento confirmado",
  payment_rejected: "Pagamento recusado",
  payment_cancelled: "Pagamento cancelado",
  payment_refunded: "Pagamento reembolsado",
  payment_charged_back: "Pagamento contestado",
};
const paymentLabels: Record<string, string> = {
  pending: "Aguardando pagamento",
  in_process: "Pagamento em análise",
  approved: "Pagamento confirmado",
  rejected: "Pagamento recusado",
  cancelled: "Pagamento cancelado",
  refunded: "Pagamento reembolsado",
  partially_refunded: "Pagamento parcialmente reembolsado",
  charged_back: "Pagamento contestado",
};
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const loadOrders = () =>
    fetch("/api/orders").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setOrders(data.orders);
    });
  useEffect(() => {
    loadOrders()
      .catch((e) =>
        setError(e.message || "Não foi possível carregar os pedidos."),
      )
      .finally(() => setLoading(false));
  }, []);
  const confirmReceived = async (id: string) => {
    setConfirming(id);
    setError("");
    try {
      const response = await fetch(`/api/orders/${id}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await loadOrders();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível confirmar o recebimento.",
      );
    } finally {
      setConfirming("");
    }
  };
  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  return (
    <main className="flex-1 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar à loja
        </Link>
        <div className="mt-5">
          <h1 className="text-2xl font-bold text-gray-900">Meus pedidos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe a aprovação e o horário agendado para cada entrega.
          </p>
        </div>
        {loading ? (
          <p className="mt-8 rounded-xl bg-white p-8 text-center text-sm text-gray-500">
            Carregando seus pedidos...
          </p>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {error}{" "}
            {error.includes("Faça login") && (
              <Link href="/login?next=/pedidos" className="font-bold underline">
                Entrar na conta
              </Link>
            )}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-14 text-center">
            <PackageCheck className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-3 font-bold text-gray-900">
              Você ainda não tem pedidos
            </h2>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Explorar produtos
            </Link>
          </div>
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
                      <p className="text-xs text-gray-500">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Realizado em{" "}
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === "approved" || order.payment_status === "approved" ? "bg-emerald-50 text-emerald-700" : order.status === "cancelled" || order.payment_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}
                      >
                        {order.status === "pending_payment"
                          ? paymentLabels[order.payment_status] || labels[order.status]
                          : labels[order.status] || order.status}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>
                  {isOpen && (
                    <>
                      <div className="grid gap-5 p-5 md:grid-cols-2">
                        <div>
                          <h2 className="text-sm font-bold text-gray-900">
                            Produtos
                          </h2>
                          <ul className="mt-2 space-y-2">
                            {order.items.map((item, index) => (
                              <li
                                key={`${item.name}-${index}`}
                                className="flex justify-between gap-2 text-sm"
                              >
                                <span className="text-gray-600">
                                  {item.quantity}× {item.name}
                                </span>
                                <span className="shrink-0 font-medium text-gray-900">
                                  {money.format(Number(item.lineTotal))}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-bold text-gray-900">
                            <span>Total</span>
                            <span>{money.format(Number(order.total))}</span>
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {paymentLabels[order.payment_status] || (order.payment_status === "not_required" ? "Pagamento não registrado para este pedido antigo" : "Pagamento: " + order.payment_status)}
                          </p>
                          {order.status === "pending_payment" && order.payment_url && ["pending", "in_process", "rejected"].includes(order.payment_status) && (
                            <a
                              href={order.payment_url}
                              className="mt-4 inline-flex rounded-lg bg-[#279236] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1f7a2b]"
                            >
                              {order.payment_status === "rejected" ? "Tentar pagar novamente" : "Continuar pagamento"}
                            </a>
                          )}
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <Clock3 className="h-4 w-4 text-blue-600" />
                            Entrega solicitada
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {new Date(order.scheduled_for).toLocaleString(
                              "pt-BR",
                              { dateStyle: "long", timeStyle: "short" },
                            )}
                          </p>
                          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-900">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            Endereço
                          </p>
                          <p className="mt-1 text-sm text-gray-600">
                            {order.address.street}, {order.address.number}
                            {order.address.complement
                              ? `, ${order.address.complement}`
                              : ""}
                            <br />
                            {order.address.neighborhood} · {order.address.city}/
                            {order.address.state}
                            <br />
                            CEP {order.address.cep}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                          Acompanhamento
                        </p>
                        <ol className="mt-3 space-y-3">
                          {order.history.map((event, index) => (
                            <li
                              key={`${event.status}-${event.at}-${index}`}
                              className="flex gap-3"
                            >
                              <span
                                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${index === order.history.length - 1 ? "bg-blue-600" : "bg-gray-300"}`}
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {labels[event.status] || event.status}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {event.note} ·{" "}
                                  {new Date(event.at).toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                        {order.status === "out_for_delivery" && (
                          <button
                            type="button"
                            disabled={confirming === order.id}
                            onClick={() => void confirmReceived(order.id)}
                            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                          >
                            {confirming === order.id
                              ? "Confirmando..."
                              : "Confirmar recebimento"}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {orders.some((order) => order.status === "out_for_delivery") && (
          <p className="sr-only">
            Pedido em rota de entrega. Use a opção confirmar recebimento para
            finalizar o acompanhamento.
          </p>
        )}
      </div>
    </main>
  );
}
