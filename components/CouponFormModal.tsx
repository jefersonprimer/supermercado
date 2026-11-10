"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Coupon, CouponDiscountType } from "@/types/coupon";

interface CouponFormModalProps {
  coupon?: Coupon | null;
  onClose: () => void;
  onSaved?: () => void;
}

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDecimal(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

export default function CouponFormModal({
  coupon,
  onClose,
  onSaved,
}: CouponFormModalProps) {
  const isEditing = Boolean(coupon);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [code, setCode] = useState(coupon?.code ?? "");
  const [description, setDescription] = useState(coupon?.description ?? "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discount_type ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState(
    coupon && coupon.discount_value > 0 ? String(coupon.discount_value) : "",
  );
  const [minPurchase, setMinPurchase] = useState(
    coupon ? String(coupon.min_purchase) : "0",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    coupon?.max_discount != null ? String(coupon.max_discount) : "",
  );
  const [freeShipping, setFreeShipping] = useState(
    coupon?.free_shipping ?? false,
  );
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usage_limit != null ? String(coupon.usage_limit) : "",
  );
  const [startsAt, setStartsAt] = useState(toInputDate(coupon?.starts_at));
  const [expiresAt, setExpiresAt] = useState(toInputDate(coupon?.expires_at));
  const [active, setActive] = useState(coupon?.active ?? true);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const payload = {
        code,
        description: description || null,
        discount_type: discountType,
        discount_value: discountValue ? parseDecimal(discountValue) : 0,
        min_purchase: minPurchase ? parseDecimal(minPurchase) : 0,
        max_discount: maxDiscount ? parseDecimal(maxDiscount) : null,
        free_shipping: freeShipping,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        active,
      };

      const response = await fetch(
        coupon ? `/api/coupons/${coupon.id}` : "/api/coupons",
        {
          method: coupon ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar cupom.");
      }

      onSaved?.();
      onClose();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Erro ao salvar cupom.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Editar cupom" : "Novo cupom"}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEditing ? "Editar cupom" : "Novo cupom"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {isEditing
                ? "Atualize as regras do cupom."
                : "Defina as regras de desconto do cupom."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            {feedback && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {feedback}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Código *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.toUpperCase())
                  }
                  placeholder="Ex: BEMVINDO10"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm uppercase text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Descrição
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ex: 10% off na primeira compra"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Tipo de desconto *
                </label>
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(event.target.value as CouponDiscountType)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (R$)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Valor do desconto *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required={!freeShipping}
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder={
                    freeShipping
                      ? "0.00 se não houver desconto em produtos"
                      : discountType === "percentage"
                        ? "10"
                        : "20.00"
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Compra mínima (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={minPurchase}
                  onChange={(event) => setMinPurchase(event.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Desconto máximo (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={maxDiscount}
                  onChange={(event) => setMaxDiscount(event.target.value)}
                  placeholder="Sem limite"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Limite de usos
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(event) => setUsageLimit(event.target.value)}
                  placeholder="Ilimitado"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Início da validade
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Em branco significa válido imediatamente.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Fim da validade
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Em branco significa sem data de expiração.
                </p>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={freeShipping}
                onChange={(event) => setFreeShipping(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#279236]"
              />
              <span>Oferece frete grátis</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#279236]"
              />
              <span>Cupom ativo</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#279236] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7a2b] disabled:opacity-70"
            >
              {submitting
                ? "Salvando..."
                : isEditing
                  ? "Salvar alterações"
                  : "Criar cupom"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
