import type { Product } from "@/types/product";
import type {
  AppliedPromotion,
  Promotion,
  PromotionDiscountType,
  PromotionInput,
  PromotionScope,
  PromotionTarget,
  PromotionTargetType,
  PromotionType,
} from "@/types/promotion";

const SCOPES: PromotionScope[] = [
  "store",
  "department",
  "category",
  "brand",
  "product",
];

const DISCOUNT_TYPES: PromotionDiscountType[] = [
  "percentage",
  "fixed",
  "fixed_price",
];

const TARGET_TYPES: PromotionTargetType[] = [
  "department",
  "category",
  "brand",
  "product",
];
const PROMOTION_TYPES: PromotionType[] = ["discount", "free_shipping"];

function toIsoString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizePromotion(
  row: Record<string, unknown>,
  targets: PromotionTarget[]
): Promotion {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description == null ? null : String(row.description),
    promotion_type: PROMOTION_TYPES.includes(row.promotion_type as PromotionType)
      ? (row.promotion_type as PromotionType)
      : "discount",
    min_purchase: Math.max(0, Number(row.min_purchase ?? 0)),
    scope_type: SCOPES.includes(row.scope_type as PromotionScope)
      ? (row.scope_type as PromotionScope)
      : "store",
    targets,
    discount_type: DISCOUNT_TYPES.includes(
      row.discount_type as PromotionDiscountType
    )
      ? (row.discount_type as PromotionDiscountType)
      : "percentage",
    discount_value: Number(row.discount_value ?? 0),
    min_quantity: Math.max(1, Number(row.min_quantity ?? 1)),
    max_discount:
      row.max_discount === null || row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    badge_label:
      row.badge_label === null || row.badge_label === undefined
        ? null
        : String(row.badge_label),
    priority: Number(row.priority ?? 0),
    stackable: Boolean(row.stackable),
    combinable_with_coupon:
      row.combinable_with_coupon === undefined
        ? true
        : Boolean(row.combinable_with_coupon),
    starts_at: toIsoString(row.starts_at) ?? new Date(0).toISOString(),
    expires_at: toIsoString(row.expires_at),
    active: Boolean(row.active),
    created_at: toIsoString(row.created_at) ?? new Date(0).toISOString(),
    updated_at: toIsoString(row.updated_at) ?? new Date(0).toISOString(),
  };
}

export function isPromotionActive(
  promotion: Promotion,
  now: number = Date.now()
): boolean {
  if (!promotion.active) return false;
  if (new Date(promotion.starts_at).getTime() > now) return false;
  if (
    promotion.expires_at &&
    new Date(promotion.expires_at).getTime() <= now
  ) {
    return false;
  }

  return true;
}

export function promotionMatchesProduct(
  promotion: Promotion,
  product: Product
): boolean {
  if (promotion.scope_type === "store") return true;

  return promotion.targets.some((target) => {
    switch (target.type) {
      case "product":
        return target.value === product.id || target.value === product.slug;
      case "department":
        return (
          Boolean(product.department) &&
          slugify(product.department ?? "") === slugify(target.value)
        );
      case "category":
        return (
          Boolean(product.category) &&
          slugify(product.category ?? "") === slugify(target.value)
        );
      case "brand":
        return (
          Boolean(product.brand) &&
          slugify(product.brand ?? "") === slugify(target.value)
        );
      default:
        return false;
    }
  });
}

export function getPromotedUnitPrice(
  promotion: AppliedPromotion | Promotion,
  unitPrice: number
): number {
  const price = Math.max(Number(unitPrice) || 0, 0);
  const value = Math.max(Number(promotion.discount_value) || 0, 0);

  switch (promotion.discount_type) {
    case "percentage":
      return roundCurrency(price * (1 - clamp(value, 0, 100) / 100));
    case "fixed":
      return roundCurrency(Math.max(price - value, 0));
    case "fixed_price":
      return roundCurrency(Math.min(price, value));
    default:
      return price;
  }
}

export function calculateLineDiscount(
  promotion: AppliedPromotion | Promotion | null | undefined,
  unitPrice: number,
  quantity: number
): number {
  if (!promotion) return 0;

  const qty = Math.floor(Number(quantity) || 0);
  if (qty <= 0) return 0;
  if (qty < Math.max(1, Number(promotion.min_quantity) || 1)) return 0;

  const price = Math.max(Number(unitPrice) || 0, 0);
  const gross = price * qty;
  if (gross <= 0) return 0;

  const value = Math.max(Number(promotion.discount_value) || 0, 0);

  let discount = 0;

  switch (promotion.discount_type) {
    case "percentage":
      discount = gross * (clamp(value, 0, 100) / 100);
      break;
    case "fixed":
      discount = value * qty;
      break;
    case "fixed_price":
      discount = Math.max(price - clamp(value, 0, price), 0) * qty;
      break;
  }

  if (
    promotion.max_discount !== null &&
    promotion.max_discount !== undefined &&
    promotion.max_discount > 0
  ) {
    discount = Math.min(discount, promotion.max_discount);
  }

  return roundCurrency(clamp(discount, 0, gross));
}

export function selectPromotionForProduct(
  product: Product,
  promotions: Promotion[]
): Promotion | null {
  const unitPrice = Number(product.price) || 0;

  const candidates = promotions
    .filter(
      (promotion) =>
        isPromotionActive(promotion) &&
        promotionMatchesProduct(promotion, product)
    )
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;

      const discountA = unitPrice - getPromotedUnitPrice(a, unitPrice);
      const discountB = unitPrice - getPromotedUnitPrice(b, unitPrice);

      return discountB - discountA;
    });

  return candidates[0] ?? null;
}

export function toAppliedPromotion(
  promotion: Promotion
): AppliedPromotion {
  return {
    id: promotion.id,
    name: promotion.name,
    discount_type: promotion.discount_type,
    discount_value: promotion.discount_value,
    min_quantity: promotion.min_quantity,
    max_discount: promotion.max_discount,
    badge_label: promotion.badge_label,
    combinable_with_coupon: promotion.combinable_with_coupon,
  };
}

export interface ProductPromotionFields {
  promotion: AppliedPromotion | null;
  promotional_price: number | null;
  promotional_badge: string | null;
  promotional_discount_percent: number | null;
}

export function buildProductPromotionFields(
  product: Product,
  promotions: Promotion[]
): ProductPromotionFields {
  const promotion = selectPromotionForProduct(product, promotions);

  if (!promotion) {
    return {
      promotion: null,
      promotional_price: null,
      promotional_badge: null,
      promotional_discount_percent: null,
    };
  }

  const unitPrice = Number(product.price) || 0;
  const promotedPrice = getPromotedUnitPrice(promotion, unitPrice);
  const appliesAtOne =
    promotion.min_quantity <= 1 && promotedPrice < unitPrice;

  return {
    promotion: toAppliedPromotion(promotion),
    promotional_price: appliesAtOne ? promotedPrice : null,
    promotional_badge: promotion.badge_label,
    promotional_discount_percent:
      appliesAtOne && unitPrice > 0
        ? Math.round((1 - promotedPrice / unitPrice) * 100)
        : null,
  };
}

export interface ParsedPromotionInput {
  name: string;
  description: string | null;
  promotion_type: PromotionType;
  min_purchase: number;
  scope_type: PromotionScope;
  targets: PromotionTarget[];
  discount_type: PromotionDiscountType;
  discount_value: number;
  min_quantity: number;
  max_discount: number | null;
  badge_label: string | null;
  priority: number;
  stackable: boolean;
  combinable_with_coupon: boolean;
  starts_at: Date | null;
  expires_at: Date | null;
  active: boolean;
}

export type PromotionParseResult =
  | { error: string }
  | { value: ParsedPromotionInput };

export function parsePromotionInput(
  input: PromotionInput
): PromotionParseResult {
  const name = String(input.name ?? "").trim();

  if (!name) {
    return { error: "Informe o nome da promoção." };
  }

  const scopeType = input.scope_type;

  if (!SCOPES.includes(scopeType)) {
    return { error: "Escopo da promoção inválido." };
  }

  const discountType = input.discount_type;

  if (!DISCOUNT_TYPES.includes(discountType)) {
    return { error: "Tipo de desconto inválido." };
  }

  const promotionType = input.promotion_type ?? "discount";
  if (!PROMOTION_TYPES.includes(promotionType)) {
    return { error: "Tipo de promoção inválido." };
  }
  const minPurchase = Number(input.min_purchase ?? 0);
  if (!Number.isFinite(minPurchase) || minPurchase < 0) {
    return { error: "Informe uma compra mínima válida." };
  }

  if (promotionType === "free_shipping" && scopeType !== "store") {
    return { error: "A promoção de frete grátis deve valer para a loja inteira." };
  }

  const discountValue = promotionType === "free_shipping" ? 0 : Number(input.discount_value);

  if (!Number.isFinite(discountValue) || (promotionType === "discount" && discountValue <= 0)) {
    return { error: "Informe um valor de desconto válido." };
  }

  if (discountType === "percentage" && discountValue > 100) {
    return { error: "O desconto percentual não pode passar de 100%." };
  }

  const minQuantity = Math.floor(Number(input.min_quantity ?? 1));

  if (!Number.isFinite(minQuantity) || minQuantity < 1) {
    return { error: "A quantidade mínima deve ser pelo menos 1." };
  }

  const maxDiscountRaw = input.max_discount;
  const maxDiscount =
    maxDiscountRaw === null ||
    maxDiscountRaw === undefined ||
    String(maxDiscountRaw).trim() === ""
      ? null
      : Number(maxDiscountRaw);

  if (
    maxDiscount !== null &&
    (!Number.isFinite(maxDiscount) || maxDiscount <= 0)
  ) {
    return { error: "O desconto máximo deve ser maior que zero." };
  }

  let targets: PromotionTarget[] = [];

  if (scopeType !== "store") {
    const rawTargets = Array.isArray(input.targets) ? input.targets : [];

    targets = rawTargets
      .flatMap((target) => {
        if (!target || typeof target !== "object") return [];

        const type = target.type;
        const value = String(target.value ?? "").trim();

        if (!TARGET_TYPES.includes(type) || !value) return [];

        return [{ type, value }];
      })
      .filter((target) => target.type === scopeType)
      .filter(
        (target, index, list) =>
          list.findIndex(
            (item) =>
              item.type === target.type &&
              slugify(item.value) === slugify(target.value)
          ) === index
      );

    if (targets.length === 0) {
      return { error: "Selecione pelo menos um alvo para a promoção." };
    }
  }

  const priority = Math.trunc(Number(input.priority ?? 0)) || 0;

  const startsAtRaw = input.starts_at;
  const startsAt =
    startsAtRaw === null || startsAtRaw === undefined || startsAtRaw === ""
      ? null
      : new Date(startsAtRaw);

  if (startsAt !== null && Number.isNaN(startsAt.getTime())) {
    return { error: "Data de início inválida." };
  }

  const expiresAtRaw = input.expires_at;
  const expiresAt =
    expiresAtRaw === null || expiresAtRaw === undefined || expiresAtRaw === ""
      ? null
      : new Date(expiresAtRaw);

  if (expiresAt !== null && Number.isNaN(expiresAt.getTime())) {
    return { error: "Data de término inválida." };
  }

  if (startsAt && expiresAt && expiresAt.getTime() <= startsAt.getTime()) {
    return { error: "A data de término deve ser depois da data de início." };
  }

  return {
    value: {
      name,
      description: input.description?.trim() || null,
      promotion_type: promotionType,
      min_purchase: minPurchase,
      scope_type: scopeType,
      targets,
      discount_type: discountType,
      discount_value: discountValue,
      min_quantity: minQuantity,
      max_discount: maxDiscount,
      badge_label: input.badge_label?.trim() || null,
      priority,
      stackable: Boolean(input.stackable),
      combinable_with_coupon:
        input.combinable_with_coupon === undefined
          ? true
          : Boolean(input.combinable_with_coupon),
      starts_at: startsAt,
      expires_at: expiresAt,
      active: input.active ?? true,
    },
  };
}
