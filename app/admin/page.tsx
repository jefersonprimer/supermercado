"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Tag,
  Ticket,
  MessageSquareText,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import ProductFormModal from "@/components/ProductFormModal";
import type { Product } from "@/types/product";
import {
  DEFAULT_STORE_SCHEDULE,
  WEEK_DAYS,
  type StoreSchedule,
} from "@/lib/store-hours";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOrder, setProductOrder] = useState(
    "default" as
      | "default"
      | "stock-high"
      | "stock-low"
      | "department"
      | "category"
      | "subcategory",
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deliveryFee, setDeliveryFee] = useState("10");
  const [deliveryFeeSaving, setDeliveryFeeSaving] = useState(false);
  const [storeSchedule, setStoreSchedule] = useState<StoreSchedule>(
    DEFAULT_STORE_SCHEDULE,
  );
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      const data = await response.json();

      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetch("/api/delivery-fee")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.fee !== undefined) setDeliveryFee(String(data.fee));
      })
      .catch(() => undefined);

    fetch("/api/store-schedule")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data?.schedule) setStoreSchedule(data.schedule);
      })
      .catch(() => undefined);

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (active && response.ok) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const saveDeliveryFee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDeliveryFeeSaving(true);
    try {
      const response = await fetch("/api/delivery-fee", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fee: Number(deliveryFee.replace(",", ".")) }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível salvar.");
      setDeliveryFee(String(data.fee));
      setFeedback({ type: "success", text: "Taxa de entrega atualizada." });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a taxa.",
      });
    } finally {
      setDeliveryFeeSaving(false);
    }
  };

  const saveStoreSchedule = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setScheduleSaving(true);
    try {
      const response = await fetch("/api/store-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeSchedule),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível salvar.");
      setStoreSchedule(data.schedule);
      setFeedback({
        type: "success",
        text: "Horário de funcionamento atualizado.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o horário.",
      });
    } finally {
      setScheduleSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaved = () => {
    setFeedback({ type: "success", text: "Produto salvo com sucesso!" });
    closeModal();
    fetchProducts();
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Excluir o produto "${productName}"?`)) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((previous) =>
          previous.filter((product) => product.id !== id),
        );
        setFeedback({ type: "success", text: "Produto excluído com sucesso!" });
      } else {
        setFeedback({ type: "error", text: "Erro ao excluir produto." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", text: "Erro ao excluir produto." });
    }
  };

  const visibleProducts = [...products];
  if (productOrder === "stock-high") {
    visibleProducts.sort((a, b) => Number(b.stock) - Number(a.stock));
  } else if (productOrder === "stock-low") {
    visibleProducts.sort((a, b) => Number(a.stock) - Number(b.stock));
  } else if (productOrder !== "default") {
    const field = {
      department: (product: Product) => product.department || "",
      category: (product: Product) => product.category || "",
      subcategory: (product: Product) => product.subcategory || "",
    }[productOrder];
    visibleProducts.sort((a, b) =>
      field(a).localeCompare(field(b), "pt-BR", { sensitivity: "base" }),
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-4 ">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestão de Produtos
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Cadastre, edite e remova os produtos da farmácia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap justify-start">
            <Link
              href="/admin/pedidos"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#279236]/20 bg-[#279236]/5 px-3 py-2 text-xs font-semibold text-[#1f7a2b] transition hover:bg-[#279236]/10 sm:text-sm"
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              Pedidos recebidos
            </Link>
            <Link
              href="/admin/candidaturas"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
            >
              <UsersRound className="h-4 w-4 shrink-0" />
              Candidaturas
            </Link>
            <Link
              href="/admin/sac"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
            >
              <MessageSquareText className="h-4 w-4 shrink-0" />
              Mensagens SAC
            </Link>
            <button
              type="button"
              onClick={() => setScheduleModalOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
            >
              Funcionamento e agendamento
            </button>
            <Link
              href="/promocoes"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
            >
              <Tag className="h-4 w-4 shrink-0" />
              Gerenciar promoções
            </Link>
            <Link
              href="/cupons"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:text-sm"
            >
              <Ticket className="h-4 w-4 shrink-0" />
              Gerenciar cupons
            </Link>

            <button
              type="button"
              onClick={openCreateModal}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#279236] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1f7a2b] sm:col-auto sm:text-sm"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Novo produto
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-lg border p-3.5 text-sm ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-gray-900">
              Produtos cadastrados ({products.length})
            </h2>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span className="shrink-0">Ordenar por</span>
              <select
                value={productOrder}
                onChange={(event) =>
                  setProductOrder(event.target.value as typeof productOrder)
                }
                className="min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#279236] focus:ring-2 focus:ring-[#279236]/20"
              >
                <option value="default">Padrão</option>
                <option value="stock-high">Estoque: maior para menor</option>
                <option value="stock-low">Estoque: menor para maior</option>
                <option value="department">Departamento</option>
                <option value="category">Categoria</option>
                <option value="subcategory">Subcategoria</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Carregando...
            </p>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Nenhum produto cadastrado ainda.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleProducts.map((product) => {
                const firstImage =
                  Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : null;

                return (
                  <article
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    {firstImage ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                        <Image
                          src={firstImage}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                        Sem foto
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="truncate text-xs text-gray-500">
                        {product.brand ? `${product.brand} • ` : ""}
                        {product.department || product.category}
                      </p>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          R${" "}
                          {Number(product.price).toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Estoque: {product.stock}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="rounded px-2 py-1 text-xs font-semibold text-[#279236] transition hover:bg-[#279236]/5"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="rounded px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {scheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setScheduleModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            className="h-dvh max-h-dvh w-full max-w-none overflow-y-auto rounded-none bg-white p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="schedule-modal-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Funcionamento e agendamento
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Os clientes poderão escolher horários apenas nos dias e
                  período abaixo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={saveDeliveryFee}
              className="mb-5 flex flex-wrap items-end justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div>
                <label
                  htmlFor="delivery-fee"
                  className="block text-sm font-bold text-gray-900"
                >
                  Taxa padrão de entrega
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Cupons de frete grátis podem zerar essa taxa.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">R$</span>
                <input
                  id="delivery-fee"
                  type="number"
                  min="0"
                  max="10000"
                  step="0.01"
                  required
                  value={deliveryFee}
                  onChange={(event) => setDeliveryFee(event.target.value)}
                  className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm focus:border-[#279236] focus:outline-none focus:ring-2 focus:ring-[#279236]/10"
                />
                <button
                  type="submit"
                  disabled={deliveryFeeSaving}
                  className="rounded-lg bg-[#279236] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f7a2b] disabled:opacity-60"
                >
                  {deliveryFeeSaving ? "Salvando..." : "Salvar taxa"}
                </button>
              </div>
            </form>
            <form onSubmit={saveStoreSchedule} className="space-y-5">
              <fieldset>
                <legend className="mb-2 text-xs font-semibold uppercase text-gray-600">
                  Dias abertos
                </legend>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => (
                    <label
                      key={day.value}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${storeSchedule.openDays.includes(day.value) ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800" : "border-gray-200 text-gray-600"}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={storeSchedule.openDays.includes(day.value)}
                        onChange={(event) =>
                          setStoreSchedule((current) => ({
                            ...current,
                            openDays: event.target.checked
                              ? [...current.openDays, day.value].sort(
                                  (a, b) => a - b,
                                )
                              : current.openDays.filter(
                                  (value) => value !== day.value,
                                ),
                          }))
                        }
                      />
                      {day.label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap items-end gap-4">
                {storeSchedule.intervals.map((interval, index) => (
                  <div
                    key={index}
                    className="flex items-end gap-2 rounded-lg border border-gray-200 p-3"
                  >
                    <label className="text-xs font-semibold text-gray-700">
                      Abre
                      <input
                        type="time"
                        required
                        value={interval.opensAt}
                        onChange={(event) =>
                          setStoreSchedule((current) => ({
                            ...current,
                            intervals: current.intervals.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, opensAt: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                        className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </label>
                    <label className="text-xs font-semibold text-gray-700">
                      Fecha
                      <input
                        type="time"
                        required
                        value={interval.closesAt}
                        onChange={(event) =>
                          setStoreSchedule((current) => ({
                            ...current,
                            intervals: current.intervals.map(
                              (item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, closesAt: event.target.value }
                                  : item,
                            ),
                          }))
                        }
                        className="mt-1 block rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                      />
                    </label>
                    {storeSchedule.intervals.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Remover período ${index + 1}`}
                        onClick={() =>
                          setStoreSchedule((current) => ({
                            ...current,
                            intervals: current.intervals.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          }))
                        }
                        className="mb-1 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {storeSchedule.intervals.length < 4 && (
                  <button
                    type="button"
                    onClick={() =>
                      setStoreSchedule((current) => ({
                        ...current,
                        intervals: [
                          ...current.intervals,
                          { opensAt: "13:00", closesAt: "18:00" },
                        ],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar período
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                <label className="text-xs font-semibold text-gray-700">
                  Agendar até quantos dias à frente
                  <input
                    type="number"
                    required
                    min="1"
                    max="365"
                    value={storeSchedule.maxAdvanceDays}
                    onChange={(event) =>
                      setStoreSchedule((current) => ({
                        ...current,
                        maxAdvanceDays: Number(event.target.value),
                      }))
                    }
                    className="mt-1 block w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900"
                  />
                </label>
                <button
                  type="submit"
                  disabled={scheduleSaving}
                  className="rounded-lg bg-[#279236] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f7a2b] disabled:opacity-60"
                >
                  {scheduleSaving ? "Salvando..." : "Salvar funcionamento"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
