"use client";

import { useEffect, useState } from "react";
import {
  BadgePercent,
  CalendarClock,
  Check,
  Copy,
  Pencil,
  Percent,
  Plus,
  ShoppingBag,
  Trash2,
  TicketPercent,
  Users,
} from "lucide-react";
import CouponFormModal from "@/components/CouponFormModal";
import type { Coupon } from "@/types/coupon";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getCouponStatus(coupon: Coupon) {
  const now = Date.now();

  if (!coupon.active) return "Inativo";
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= now) {
    return "Expirado";
  }
  if (new Date(coupon.starts_at).getTime() > now) return "Em breve";
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return "Esgotado";
  }

  return "Ativo";
}

const statusChipOnHeader: Record<string, string> = {
  Ativo: "bg-white text-[#1f7a2b] ring-white/40",
  "Em breve": "bg-amber-300/90 text-amber-950 ring-amber-100/40",
  Inativo: "bg-white/15 text-white ring-white/25",
  Expirado: "bg-white/15 text-white ring-white/25",
  Esgotado: "bg-white/15 text-white ring-white/25",
};

async function fetchCouponsData() {
  const meResponse = await fetch("/api/auth/me");
  const meData = meResponse.ok ? await meResponse.json() : { user: null };
  const currentUser: UserData | null = meData.user ?? null;

  const response = await fetch(
    currentUser?.role === "admin" ? "/api/coupons?all=1" : "/api/coupons",
  );
  const data = response.ok ? await response.json() : { coupons: [] };

  return {
    user: currentUser,
    coupons: (data.coupons || []) as Coupon[],
  };
}

function CouponsSkeleton() {
  return (
    <div
      className="mt-6 flex flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando cupons"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:flex-row"
        >
          <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-[#279236]/15 to-[#279236]/5 p-5 sm:w-64 sm:shrink-0 sm:p-6 lg:w-72">
            <div className="flex items-center justify-between gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-[#279236]/20" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-[#279236]/15" />
            </div>
            <div>
              <div className="h-2.5 w-24 animate-pulse rounded bg-[#279236]/20" />
              <div className="mt-2 h-7 w-36 animate-pulse rounded bg-[#279236]/25" />
            </div>
          </div>

          <div className="relative border-t border-dashed border-gray-200 sm:hidden">
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50" />
            <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50" />
          </div>

          <div className="relative hidden w-px shrink-0 border-l border-dashed border-gray-200 sm:block">
            <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50" />
            <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-gray-50" />
          </div>

          <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="min-w-0 flex-1">
              <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-gray-100" />

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4">
                <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
              </div>
            </div>

            <div className="h-11 w-full animate-pulse rounded-xl bg-[#279236]/15 sm:w-44 sm:shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    let active = true;

    fetchCouponsData()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setCoupons(data.coupons);
        setStatuses(
          Object.fromEntries(
            data.coupons.map((coupon) => [coupon.id, getCouponStatus(coupon)]),
          ),
        );
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadCoupons = async () => {
    try {
      const data = await fetchCouponsData();
      setUser(data.user);
      setCoupons(data.coupons);
      setStatuses(
        Object.fromEntries(
          data.coupons.map((coupon) => [coupon.id, getCouponStatus(coupon)]),
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSaved = () => {
    setFeedback({ type: "success", text: "Cupom salvo com sucesso!" });
    setLoading(true);
    loadCoupons();
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Excluir o cupom "${coupon.code}"?`)) return;

    try {
      const response = await fetch(`/api/coupons/${coupon.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCoupons((previous) =>
          previous.filter((item) => item.id !== coupon.id),
        );
        setStatuses((previous) => {
          const next = { ...previous };
          delete next[coupon.id];
          return next;
        });
        setFeedback({ type: "success", text: "Cupom excluído com sucesso!" });
      } else {
        const data = await response.json();
        setFeedback({
          type: "error",
          text: data.error || "Erro ao excluir cupom.",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", text: "Erro ao excluir cupom." });
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Cupons de desconto
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Use um dos cupons abaixo na finalização da sua compra.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#279236] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f7a2b] sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              Novo cupom
            </button>
          )}
        </div>

        {feedback && (
          <div
            className={`mt-4 rounded-lg border p-3.5 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        {loading ? (
          <CouponsSkeleton />
        ) : coupons.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[#279236]/30 bg-white px-4 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#279236]/10">
              <TicketPercent
                className="h-8 w-8 text-[#279236]"
                aria-hidden="true"
              />
            </span>
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Nenhum cupom disponível
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Volte em breve para conferir novas promoções.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {coupons.map((coupon) => {
              const status =
                statuses[coupon.id] ?? (coupon.active ? "Ativo" : "Inativo");
              const isExpired = status === "Expirado";

              return (
                <article
                  key={coupon.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:border-[#279236]/30 hover:shadow-xl hover:shadow-[#279236]/10 sm:flex-row"
                >
                  <div className="relative flex flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-[#2a9c3b] via-[#279236] to-[#1b6b28] p-5 text-white sm:w-64 sm:shrink-0 sm:p-6 lg:w-92">
                    <span
                      className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/10"
                      aria-hidden="true"
                    />
                    <span
                      className="pointer-events-none absolute -bottom-16 -left-6 h-36 w-36 rounded-full bg-white/5"
                      aria-hidden="true"
                    />

                    <div className="relative flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
                        <TicketPercent
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${
                            statusChipOnHeader[status] ??
                            "bg-white/15 text-white ring-white/25"
                          }`}
                        >
                          {status}
                        </span>

                        {isAdmin && (
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(coupon)}
                              aria-label={`Editar ${coupon.code}`}
                              className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon)}
                              aria-label={`Excluir ${coupon.code}`}
                              className="rounded-lg p-1.5 text-white/80 transition hover:bg-red-500/30 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                        Cupom de desconto
                      </p>
                      <p className="mt-1 truncate text-xl font-black tracking-[0.1em] text-white drop-shadow-sm lg:text-2xl">
                        {coupon.code}
                      </p>
                    </div>
                  </div>

                  <div className="relative hidden w-px shrink-0 border-l border-dashed border-gray-200 sm:block">
                    <span
                      className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50"
                      aria-hidden="true"
                    />
                    <span
                      className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-gray-50"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="relative border-t border-dashed border-gray-200 sm:hidden">
                    <span
                      className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50"
                      aria-hidden="true"
                    />
                    <span
                      className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-gray-50"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        {coupon.discount_value > 0 ? (
                          <>
                            <span className="flex items-center gap-1 text-4xl font-black leading-none text-[#279236]">
                              {coupon.discount_type === "percentage" ? (
                                <>
                                  {coupon.discount_value}
                                  <Percent
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </>
                              ) : (
                                currencyFormatter.format(coupon.discount_value)
                              )}
                            </span>
                            <span className="text-sm font-bold uppercase tracking-wide text-[#279236]/70">
                              off
                            </span>
                          </>
                        ) : null}
                        {coupon.free_shipping && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                            Frete grátis
                          </span>
                        )}
                      </div>

                      {coupon.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                          {coupon.description}
                        </p>
                      )}

                      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                        <li className="flex items-start gap-2">
                          <ShoppingBag
                            className="mt-px h-3.5 w-3.5 shrink-0 text-[#279236]/70"
                            aria-hidden="true"
                          />
                          <span>
                            {coupon.min_purchase > 0
                              ? `Compra mínima de ${currencyFormatter.format(
                                  coupon.min_purchase,
                                )}`
                              : "Sem valor mínimo de compra"}
                          </span>
                        </li>
                        {coupon.max_discount !== null &&
                          coupon.max_discount > 0 && (
                            <li className="flex items-start gap-2">
                              <BadgePercent
                                className="mt-px h-3.5 w-3.5 shrink-0 text-[#279236]/70"
                                aria-hidden="true"
                              />
                              <span>
                                Desconto máximo de{" "}
                                {currencyFormatter.format(coupon.max_discount)}
                              </span>
                            </li>
                          )}
                        {coupon.expires_at && (
                          <li className="flex items-start gap-2">
                            <CalendarClock
                              className="mt-px h-3.5 w-3.5 shrink-0 text-[#279236]/70"
                              aria-hidden="true"
                            />
                            <span>
                              {isExpired ? "Expirou em" : "Válido até"}{" "}
                              {formatDate(coupon.expires_at)}
                            </span>
                          </li>
                        )}
                        {coupon.usage_limit !== null && (
                          <li className="flex items-start gap-2">
                            <Users
                              className="mt-px h-3.5 w-3.5 shrink-0 text-[#279236]/70"
                              aria-hidden="true"
                            />
                            <span>
                              {coupon.used_count} de {coupon.usage_limit} usos
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(coupon.code)}
                      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wide transition-all sm:w-44 sm:shrink-0 ${
                        copiedCode === coupon.code
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-[#279236] text-white shadow-sm shadow-[#279236]/20 hover:bg-[#1f7a2b] hover:shadow-md hover:shadow-[#279236]/30"
                      }`}
                    >
                      {copiedCode === coupon.code ? (
                        <>
                          <Check className="h-4 w-4" />
                          Código copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar código
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}
