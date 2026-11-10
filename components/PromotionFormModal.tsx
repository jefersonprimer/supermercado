"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { DEPARTMENTS } from "@/lib/departments";
import type {
  Promotion,
  PromotionScope,
  PromotionTarget,
  PromotionType,
} from "@/types/promotion";
import type { Product } from "@/types/product";

interface PromotionFormModalProps {
  promotion?: Promotion | null;
  onClose: () => void;
  onSaved?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]";

const SCOPE_OPTIONS: { value: PromotionScope; label: string }[] = [
  { value: "store", label: "Loja inteira" },
  { value: "department", label: "Departamento" },
  { value: "category", label: "Categoria" },
  { value: "brand", label: "Marca" },
  { value: "product", label: "Produto específico" },
];

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PromotionFormModal({
  promotion,
  onClose,
  onSaved,
}: PromotionFormModalProps) {
  const isEditing = Boolean(promotion);

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState(promotion?.name ?? "");
  const [description, setDescription] = useState(promotion?.description ?? "");
  const [promotionType, setPromotionType] = useState<PromotionType>(promotion?.promotion_type ?? "discount");
  const [minPurchase, setMinPurchase] = useState(String(promotion?.min_purchase ?? 0));
  const [scope, setScope] = useState<PromotionScope>(
    promotion?.scope_type ?? "store",
  );
  const [targets, setTargets] = useState<PromotionTarget[]>(
    promotion?.targets ?? [],
  );
  const [discountType, setDiscountType] = useState(
    promotion?.discount_type ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState(
    promotion ? String(promotion.discount_value) : "",
  );
  const [minQuantity, setMinQuantity] = useState(
    promotion ? String(promotion.min_quantity) : "1",
  );
  const [maxDiscount, setMaxDiscount] = useState(
    promotion?.max_discount != null ? String(promotion.max_discount) : "",
  );
  const [badgeLabel, setBadgeLabel] = useState(promotion?.badge_label ?? "");
  const [priority, setPriority] = useState(
    promotion ? String(promotion.priority) : "0",
  );
  const [combinableWithCoupon, setCombinableWithCoupon] = useState(
    promotion?.combinable_with_coupon ?? true,
  );
  const [startsAt, setStartsAt] = useState(toInputDate(promotion?.starts_at));
  const [expiresAt, setExpiresAt] = useState(
    toInputDate(promotion?.expires_at),
  );
  const [active, setActive] = useState(promotion?.active ?? true);
  const [targetSearch, setTargetSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => {
        if (active) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, []);

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

  const departments = useMemo(() => {
    const names = new Set<string>(
      DEPARTMENTS.map((department) => department.name),
    );

    products.forEach((product) => {
      if (product.department) names.add(product.department);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const brands = useMemo(() => {
    const names = new Set<string>();

    products.forEach((product) => {
      const brand = product.brand?.trim();
      if (brand) names.add(brand);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const categories = useMemo(() => {
    const names = new Set<string>();

    DEPARTMENTS.forEach((department) => {
      department.categories.forEach((category) => names.add(category));
    });

    products.forEach((product) => {
      if (product.category) names.add(product.category);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const targetOptions = useMemo(() => {
    switch (scope) {
      case "department":
        return departments.map((department) => ({
          value: department,
          label: department,
        }));
      case "category":
        return categories.map((category) => ({
          value: category,
          label: category,
        }));
      case "brand":
        return brands.map((brand) => ({
          value: brand,
          label: brand,
        }));
      case "product":
        return products.map((product) => ({
          value: product.id,
          label: product.name,
        }));
      default:
        return [];
    }
  }, [scope, departments, categories, brands, products]);

  const filteredOptions = useMemo(() => {
    const search = targetSearch.trim().toLowerCase();

    if (!search) return targetOptions;

    return targetOptions.filter((option) =>
      option.label.toLowerCase().includes(search),
    );
  }, [targetOptions, targetSearch]);

  const handleScopeChange = (nextScope: PromotionScope) => {
    setScope(nextScope);
    setTargets([]);
    setTargetSearch("");
  };

  const isTargetSelected = (value: string) =>
    targets.some((target) => target.type === scope && target.value === value);

  const toggleTarget = (value: string) => {
    if (scope === "store") return;

    const type = scope;

    setTargets((previous) =>
      previous.some((target) => target.type === type && target.value === value)
        ? previous.filter(
            (target) => !(target.type === type && target.value === value),
          )
        : [...previous, { type, value }],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (promotionType === "discount" && scope !== "store" && targets.length === 0) {
      setFeedback("Selecione pelo menos um alvo para a promoção.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        description: description.trim() || null,
        promotion_type: promotionType,
        min_purchase: parseFloat(String(minPurchase).replace(",", ".")) || 0,
        scope_type: promotionType === "free_shipping" ? "store" : scope,
        targets: promotionType === "free_shipping" ? [] : targets,
        discount_type: discountType,
        discount_value: promotionType === "free_shipping" ? 0 : parseFloat(String(discountValue).replace(",", ".")),
        min_quantity: parseInt(minQuantity, 10) || 1,
        max_discount: maxDiscount
          ? parseFloat(String(maxDiscount).replace(",", "."))
          : null,
        badge_label: badgeLabel.trim() || null,
        priority: parseInt(priority, 10) || 0,
        combinable_with_coupon: combinableWithCoupon,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        active,
      };

      const response = await fetch(
        promotion ? `/api/promotions/${promotion.id}` : "/api/promotions",
        {
          method: promotion ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar promoção.");
      }

      onSaved?.();
      onClose();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Erro ao salvar promoção.",
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
        aria-label={isEditing ? "Editar promoção" : "Nova promoção"}
        onMouseDown={(event) => event.stopPropagation()}
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col overflow-hidden rounded-none bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isEditing ? "Editar promoção" : "Nova promoção"}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Crie descontos automáticos ou promoções de frete grátis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
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
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Semana do protetor solar"
                  className={inputClass}
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
                  placeholder="Ex: 20% off em toda a categoria"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                Tipo de promoção *
              </label>
              <select
                value={promotionType}
                onChange={(event) => {
                  const nextType = event.target.value as PromotionType;
                  setPromotionType(nextType);
                  if (nextType === "free_shipping") {
                    setScope("store");
                    setTargets([]);
                  }
                }}
                className={inputClass}
              >
                <option value="discount">Desconto em produtos</option>
                <option value="free_shipping">Frete grátis por compra mínima</option>
              </select>
            </div>

            {promotionType === "free_shipping" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <label className="mb-1 block text-xs font-semibold uppercase text-emerald-900">
                  Compra mínima para frete grátis (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={minPurchase}
                  onChange={(event) => setMinPurchase(event.target.value)}
                  placeholder="150.00"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-emerald-800">
                  O frete será grátis em pedidos iguais ou acima deste valor durante a validade da promoção.
                </p>
              </div>
            )}

            {promotionType === "discount" && <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                Onde a promoção vale *
              </label>
              <select
                value={scope}
                onChange={(event) =>
                  handleScopeChange(event.target.value as PromotionScope)
                }
                className={inputClass}
              >
                {SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>}

            {promotionType === "free_shipping" ? null : scope === "store" ? (
              <p className="rounded-lg border border-[#279236]/20 bg-[#279236]/5 px-3 py-2.5 text-xs font-medium text-[#1f7a2b]">
                A promoção será aplicada automaticamente a todos os produtos da
                loja.
              </p>
            ) : (
              <div className="rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
                  <span className="text-xs font-semibold uppercase text-gray-700">
                    Alvos selecionados ({targets.length})
                  </span>
                  {targetOptions.length > 8 && (
                    <input
                      type="search"
                      value={targetSearch}
                      onChange={(event) => setTargetSearch(event.target.value)}
                      placeholder="Buscar..."
                      className="w-40 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#279236]"
                    />
                  )}
                </div>

                {filteredOptions.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-500">
                    Nenhuma opção encontrada.
                  </p>
                ) : (
                  <ul className="max-h-52 space-y-1 overflow-y-auto p-2 [scrollbar-width:thin]">
                    {filteredOptions.map((option) => (
                      <li key={option.value}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={isTargetSelected(option.value)}
                            onChange={() => toggleTarget(option.value)}
                            className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#279236]"
                          />
                          <span className="truncate">{option.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {promotionType === "discount" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Tipo de desconto *
                </label>
                <select
                  value={discountType}
                  onChange={(event) =>
                    setDiscountType(
                      event.target.value as
                        | "percentage"
                        | "fixed"
                        | "fixed_price",
                    )
                  }
                  className={inputClass}
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo por unidade (R$)</option>
                  <option value="fixed_price">
                    Preço fixo por unidade (R$)
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  placeholder={discountType === "percentage" ? "10" : "19.90"}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Quantidade mínima
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minQuantity}
                  onChange={(event) => setMinQuantity(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>}

            {promotionType === "discount" && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Desconto máximo (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={maxDiscount}
                  onChange={(event) => setMaxDiscount(event.target.value)}
                  placeholder="Sem limite"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Selo / badge
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={badgeLabel}
                  onChange={(event) => setBadgeLabel(event.target.value)}
                  placeholder="Ex: 20% OFF"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Prioridade
                </label>
                <input
                  type="number"
                  step="1"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Maior prioridade vence quando não acumulável.
                </p>
              </div>
            </div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase text-gray-700">
                  Início da validade
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  className={inputClass}
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
                  className={inputClass}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Em branco significa sem data de expiração.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={combinableWithCoupon}
                  onChange={(event) =>
                    setCombinableWithCoupon(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-[#279236]"
                />
                <span>Permitir acumular com cupom de desconto</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-[#279236]"
                />
                <span>Promoção ativa</span>
              </label>
            </div>
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
                  : "Criar promoção"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
