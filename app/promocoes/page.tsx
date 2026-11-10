"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import PromotionFormModal from "@/components/PromotionFormModal";
import type { Promotion, PromotionScope } from "@/types/promotion";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const SCOPE_LABELS: Record<PromotionScope, string> = {
  store: "Loja inteira",
  department: "Departamento",
  category: "Categoria",
  brand: "Marca",
  product: "Produto",
};

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

function getPromotionStatus(promotion: Promotion) {
  const now = Date.now();

  if (!promotion.active) {
    return { label: "Inativa", className: "bg-gray-100 text-gray-600" };
  }

  if (promotion.expires_at && new Date(promotion.expires_at).getTime() <= now) {
    return { label: "Expirada", className: "bg-red-50 text-red-600" };
  }

  if (new Date(promotion.starts_at).getTime() > now) {
    return { label: "Em breve", className: "bg-amber-50 text-amber-700" };
  }

  return { label: "Ativa", className: "bg-emerald-50 text-emerald-700" };
}

function discountLabel(promotion: Promotion) {
  if (promotion.promotion_type === "free_shipping") return "FRETE GRÁTIS";
  switch (promotion.discount_type) {
    case "percentage":
      return `${promotion.discount_value}% OFF`;
    case "fixed":
      return `${currencyFormatter.format(promotion.discount_value)} OFF`;
    case "fixed_price":
      return `por ${currencyFormatter.format(promotion.discount_value)}`;
    default:
      return "";
  }
}

export default function PromotionsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAdmin = user?.role === "admin";

  const loadData = async () => {
    try {
      const meResponse = await fetch("/api/auth/me");
      const meData = meResponse.ok ? await meResponse.json() : { user: null };
      const currentUser: UserData | null = meData.user ?? null;

      setUser(currentUser);

      if (currentUser?.role !== "admin") {
        setPromotions([]);
        return;
      }

      const [promotionsResponse, productsResponse] = await Promise.all([
        fetch("/api/promotions?all=1"),
        fetch("/api/products"),
      ]);

      const promotionsData = promotionsResponse.ok
        ? await promotionsResponse.json()
        : { promotions: [] };
      const productsData = productsResponse.ok
        ? await productsResponse.json()
        : { products: [] };

      setPromotions((promotionsData.promotions || []) as Promotion[]);
      setProducts((productsData.products || []) as Product[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      await loadData();
    }

    load();
  }, []);

  const productNames = useMemo(() => {
    const map = new Map<string, string>();

    products.forEach((product) => {
      map.set(product.id, product.name);
      map.set(product.slug, product.name);
    });

    return map;
  }, [products]);

  const openCreateModal = () => {
    setEditingPromotion(null);
    setModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPromotion(null);
  };

  const handleSaved = () => {
    setFeedback({ type: "success", text: "Promoção salva com sucesso!" });
    setLoading(true);
    loadData();
  };

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Excluir a promoção "${promotion.name}"?`)) return;

    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPromotions((previous) =>
          previous.filter((item) => item.id !== promotion.id),
        );
        setFeedback({
          type: "success",
          text: "Promoção excluída com sucesso!",
        });
      } else {
        const data = await response.json();
        setFeedback({
          type: "error",
          text: data.error || "Erro ao excluir promoção.",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", text: "Erro ao excluir promoção." });
    }
  };

  const describeTargets = (promotion: Promotion) => {
    if (promotion.scope_type === "store") return "Todos os produtos";

    const values = promotion.targets.map((target) =>
      target.type === "product"
        ? (productNames.get(target.value) ?? target.value)
        : target.value,
    );

    return values.join(", ");
  };

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promoções</h1>
            <p className="mt-1 text-sm text-gray-500">
              Descontos automáticos em produtos ou campanhas de frete grátis.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/admin"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Voltar ao admin
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={openCreateModal}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#279236] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f7a2b] sm:col-auto sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Nova promoção
              </button>
            )}
          </div>
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
          <p className="py-16 text-center text-sm text-gray-400">
            Carregando promoções...
          </p>
        ) : !isAdmin ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center">
            <Tag className="h-12 w-12 text-gray-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Acesso restrito
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Apenas administradores podem gerenciar promoções.
            </p>
            <Link
              href="/login"
              className="mt-6 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Entrar
            </Link>
          </div>
        ) : promotions.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-4 py-16 text-center">
            <Tag className="h-12 w-12 text-gray-300" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Nenhuma promoção cadastrada
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Crie uma promoção para aplicar descontos automáticos.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#279236] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#279236]/80"
            >
              <Plus className="h-4 w-4" />
              Nova promoção
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {promotions.map((promotion) => {
              const status = getPromotionStatus(promotion);

              return (
                <article
                  key={promotion.id}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-bold text-gray-900">
                          {promotion.name}
                        </h2>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {promotion.promotion_type === "free_shipping"
                          ? "Frete grátis • loja inteira"
                          : SCOPE_LABELS[promotion.scope_type]}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(promotion)}
                        aria-label={`Editar ${promotion.name}`}
                        className="rounded p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(promotion)}
                        aria-label={`Excluir ${promotion.name}`}
                        className="rounded p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className={`mt-3 text-2xl font-extrabold ${promotion.promotion_type === "free_shipping" ? "text-emerald-600" : "text-red-600"}`}>
                    {discountLabel(promotion)}
                  </p>

                  {promotion.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {promotion.description}
                    </p>
                  )}

                  <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      Aplica em:
                    </span>{" "}
                    {describeTargets(promotion)}
                  </p>

                  <ul className="mt-3 space-y-1 text-xs text-gray-500">
                    {promotion.promotion_type === "free_shipping" && (
                      <li>Compra mínima de {currencyFormatter.format(promotion.min_purchase)}</li>
                    )}
                    {promotion.min_quantity > 1 && (
                      <li>
                        A partir de {promotion.min_quantity} unidades por item
                      </li>
                    )}
                    {promotion.max_discount !== null &&
                      promotion.max_discount > 0 && (
                        <li>
                          Desconto máximo de{" "}
                          {currencyFormatter.format(promotion.max_discount)}
                        </li>
                      )}
                    <li>
                      Prioridade {promotion.priority} •{" "}
                      {promotion.combinable_with_coupon
                        ? "Concatena com cupom"
                        : "Não concatena com cupom"}
                    </li>
                    <li className="flex items-center gap-1">
                      <CalendarClock
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {formatDate(promotion.starts_at)}
                      {promotion.expires_at
                        ? ` até ${formatDate(promotion.expires_at)}`
                        : " • sem data final"}
                    </li>
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <PromotionFormModal
          promotion={editingPromotion}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </main>
  );
}
