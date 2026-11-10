"use client";

import Link from "next/link";
import {
  Minus,
  Package,
  Plus,
  ShoppingCart,
  ShoppingCartPlus,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { getPromotedUnitPrice } from "@/lib/promotions";
import { getUnitPriceLabel } from "@/lib/product-unit-pricing";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface ProductCardProps {
  product: Product;
  theme?: "light" | "dark";
}

export default function ProductCard({
  product,
  theme = "light",
}: ProductCardProps) {
  const { items, addToCart, setCartQuantity } = useCart();
  const quantity =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;

  const image = product.images?.[0];
  const unitPrice = Number(product.price);
  const promotion = product.promotion ?? null;
  const minQuantity = promotion?.min_quantity ?? 1;
  const promotedUnitPrice = promotion
    ? getPromotedUnitPrice(promotion, unitPrice)
    : unitPrice;
  const promoAppliesAtOne =
    promotion !== null && minQuantity <= 1 && promotedUnitPrice < unitPrice;
  const displayPrice = promoAppliesAtOne ? promotedUnitPrice : unitPrice;
  const unitPriceLabel = getUnitPriceLabel(
    product.specifications,
    displayPrice,
  );
  const originalPrice = product.original_price ?? null;
  const comparePrice = promoAppliesAtOne
    ? unitPrice
    : originalPrice !== null && originalPrice > unitPrice
      ? originalPrice
      : null;
  const installmentPrice = product.installment_price ?? null;
  const installments = product.installments ?? 3;
  const hasInstallment =
    installmentPrice !== null && installments > 1 && !promoAppliesAtOne;
  const requiresQuantity = promotion !== null && minQuantity > 1;
  const fallbackBadge = theme === "dark" ? "20% OFF" : "Oferta";
  const badgeText =
    product.promotional_badge ??
    promotion?.badge_label ??
    (product.is_new ? "Novidade" : null) ??
    (requiresQuantity
      ? `Leve ${minQuantity}+`
      : promoAppliesAtOne
        ? fallbackBadge
        : null);
  const isNewBadge = badgeText?.toLocaleLowerCase("pt-BR") === "novidade";

  const increaseQuantity = () => {
    if (quantity === 0) {
      addToCart(product, 1);
      return;
    }

    setCartQuantity(product, quantity + 1);
  };

  const decreaseQuantity = () => setCartQuantity(product, quantity - 1);

  return (
    <article
      className={
        theme === "dark"
          ? "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 p-3 transition-colors hover:border-white/25"
          : "group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300"
      }
    >
      <div className="relative">
        <Link
          href={`/produto/${product.slug}`}
          className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl ${theme === "dark" ? "bg-white" : ""}`}
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <Package className="h-10 w-10 text-gray-300" aria-hidden="true" />
          )}

          {badgeText && (
            <span
              className={
                isNewBadge
                  ? "absolute left-2 top-2 rounded-br-xl rounded-tl-xl bg-[#A01717] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-md"
                  : theme === "dark"
                    ? "absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-black shadow-sm"
                    : "absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
              }
            >
              {badgeText}
            </span>
          )}
        </Link>

        <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-end">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={increaseQuantity}
              aria-label={`Adicionar ${product.name} ao carrinho`}
              className={
                theme === "dark"
                  ? "flex shrink-0 items-center justify-center rounded-full bg-yellow-400 p-2 text-black shadow-md transition hover:bg-yellow-300 active:scale-95 cursor-pointer"
                  : "flex shrink-0 items-center justify-center rounded-full bg-[#A01717] p-2 text-white shadow-md transition hover:bg-[#7F1010] active:scale-95 cursor-pointer"
              }
            >
              <ShoppingCartPlus size={24} />
            </button>
          ) : (
            <div
              className={
                theme === "dark"
                  ? "flex w-full items-center rounded-full border border-yellow-400/40 bg-zinc-800 p-1"
                  : "flex w-full items-center rounded-full border border-[#A01717]/25 bg-white p-1"
              }
            >
              <button
                type="button"
                onClick={decreaseQuantity}
                aria-label="Diminuir quantidade"
                className={
                  theme === "dark"
                    ? "flex flex-1 items-center justify-center rounded-full p-1 text-yellow-400 transition hover:bg-white/10"
                    : "flex flex-1 items-center justify-center rounded-full p-1 text-[#A01717] transition hover:bg-gray-100"
                }
              >
                <Minus size={24} />
              </button>
              <span
                aria-live="polite"
                className={`min-w-5 flex-1 border-l border-r text-center text-sm font-medium ${theme === "dark" ? "border-white/15 text-[#363148]" : "border-gray-200 text-[#363148]"}`}
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={increaseQuantity}
                aria-label="Aumentar quantidade"
                className={
                  theme === "dark"
                    ? "flex flex-1 items-center justify-center rounded-full  border-white/15 p-1 text-yellow-400 transition hover:bg-white/10"
                    : "flex flex-1 items-center justify-center rounded-full  border-gray-200 p-1 text-[#A01717] transition hover:bg-gray-100"
                }
              >
                <Plus size={24} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <Link
          href={`/produto/${product.slug}`}
          className={`mt-1 line-clamp-3 min-h-10 text-sm font-normal leading-snug transition-colors ${theme === "dark" ? "text-white/80 hover:text-yellow-400" : "text-gray-800 hover:text-blue-600"}`}
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-3">
          {comparePrice !== null && (
            <span
              className={`block text-xs line-through ${theme === "dark" ? "text-white/30" : "text-gray-400"}`}
            >
              {currencyFormatter.format(comparePrice)}
            </span>
          )}

          <p
            className={`text-lg leading-tight ${theme === "dark" ? "font-black text-white" : "font-bold text-gray-900"}`}
          >
            {currencyFormatter.format(displayPrice)}
          </p>

          {unitPriceLabel && (
            <p
              className={`mt-1 text-xs ${theme === "dark" ? "text-white/50" : "text-gray-500"}`}
            >
              {unitPriceLabel}
            </p>
          )}

          {requiresQuantity ? (
            <p
              className={`text-xs font-semibold ${theme === "dark" ? "text-yellow-400/80" : "text-red-600"}`}
            >
              Promoção a partir de {minQuantity} un.
            </p>
          ) : hasInstallment && installmentPrice !== null ? (
            <p
              className={`text-xs ${theme === "dark" ? "text-white/30" : "text-gray-500"}`}
            >
              ou{" "}
              <span
                className={`font-semibold ${theme === "dark" ? "text-white/50" : "text-gray-700"}`}
              >
                {installments}x de {currencyFormatter.format(installmentPrice)}
              </span>
            </p>
          ) : (
            <p
              className={`text-xs ${theme === "dark" ? "text-white/30" : "text-gray-500"}`}
            >
              à vista
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
