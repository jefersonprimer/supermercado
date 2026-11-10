"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useDeliveryFee } from "@/hooks/useDeliveryFee";
import { useFreeShippingPromotion } from "@/hooks/useFreeShippingPromotion";
import { calculateLineDiscount, getPromotedUnitPrice } from "@/lib/promotions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function CartSidebar({ open, onClose }: CartSidebarProps) {
  const deliveryFee = useDeliveryFee();
  const freeShippingPromotions = useFreeShippingPromotion();
  const {
    items,
    itemCount,
    total,
    promotionsDiscount,
    finalTotal,
    coupon,
    setCartQuantity,
    removeFromCart,
  } = useCart();
  const freeShipping =
    coupon?.free_shipping === true ||
    freeShippingPromotions.some((promotion) => total >= promotion.min_purchase);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Sacola de compras"
        className={`absolute right-0 top-0 flex h-full w-full sm:max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-gray-900">
              Meu carrinho
              {itemCount > 0 && (
                <span className="ml-1.5 text-sm font-medium text-gray-500">
                  ({itemCount})
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingCart
              className="h-12 w-12 text-gray-300"
              aria-hidden="true"
            />
            <h3 className="mt-4 text-lg font-bold text-gray-900">
              Seu carrinho está vazio
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Adicione produtos para continuar.
            </p>
            <Link
              href="/"
              onClick={onClose}
              className="mt-6 rounded-full border border-[#A01717] px-4 py-3 text-sm font-semibold text-[#A01717] transition hover:bg-gray-100"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="space-y-4">
                {items.map(({ product, quantity }) => {
                  const image = product.images?.[0];
                  const unitPrice = Number(product.price);
                  const packageAmount = Number(
                    product.specifications?.quantidade_conteudo,
                  );
                  const packageUnit = product.specifications?.unidade_conteudo;
                  const packageLabel =
                    Number.isFinite(packageAmount) && packageAmount > 0
                      ? `${new Intl.NumberFormat("pt-BR", {
                          maximumFractionDigits: 3,
                        }).format(packageAmount)} ${
                          packageUnit === "unidade"
                            ? packageAmount === 1
                              ? "unidade"
                              : "unidades"
                            : packageUnit === "g"
                              ? "g"
                              : packageUnit === "kg"
                                ? "kg"
                                : packageUnit === "ml"
                                  ? "ml"
                                  : packageUnit === "l"
                                    ? "L"
                                    : "unidade"
                        }`
                      : "unidade";
                  const promotion = product.promotion ?? null;
                  const lineDiscount = calculateLineDiscount(
                    promotion,
                    unitPrice,
                    quantity,
                  );
                  const hasLinePromotion = lineDiscount > 0;
                  const promotedUnitPrice =
                    promotion && quantity >= promotion.min_quantity
                      ? getPromotedUnitPrice(promotion, unitPrice)
                      : unitPrice;
                  const lineTotal = unitPrice * quantity - lineDiscount;

                  return (
                    <li
                      key={product.id}
                      className="flex gap-3 rounded-2xl border border-gray-100 p-3"
                    >
                      <Link
                        href={`/produto/${product.slug}`}
                        onClick={onClose}
                        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden"
                      >
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <Package
                            className="h-6 w-6 text-gray-300"
                            aria-hidden="true"
                          />
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/produto/${product.slug}`}
                            onClick={onClose}
                            className="line-clamp-3 text-sm font-normal text-gray-800"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                            {hasLinePromotion && (
                              <span className="text-xs text-gray-400 line-through">
                                {currencyFormatter.format(unitPrice)}
                              </span>
                            )}
                            <span
                              className={`text-base font-medium ${
                                hasLinePromotion
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {currencyFormatter.format(
                                hasLinePromotion
                                  ? promotedUnitPrice
                                  : unitPrice,
                              )}
                            </span>
                            <span className="text-xs text-gray-500">
                              / {packageLabel}
                            </span>
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center rounded-full border border-[#A01717]/25 bg-white p-1">
                            <button
                              type="button"
                              onClick={() =>
                                setCartQuantity(product, quantity - 1)
                              }
                              aria-label="Diminuir quantidade"
                              className="flex items-center justify-center rounded-full p-1 text-[#A01717] transition hover:bg-gray-100"
                            >
                              <Minus size={24} />
                            </button>
                            <span className="min-w-5 flex-1 border-l border-r border-gray-200 px-2 text-center text-sm font-medium text-[#363148]">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setCartQuantity(product, quantity + 1)
                              }
                              disabled={quantity >= product.stock}
                              aria-label="Aumentar quantidade"
                              className="flex items-center justify-center rounded-full p-1 text-[#A01717] transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                              <Plus size={24} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-right">
                              <span className="block text-[10px] text-gray-500">
                                Total
                              </span>
                              <span className="block text-base font-semibold text-gray-900">
                                {currencyFormatter.format(lineTotal)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(product.id)}
                              aria-label={`Remover ${product.name}`}
                              className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <dt>Subtotal</dt>
                  <dd>{currencyFormatter.format(total)}</dd>
                </div>
                {promotionsDiscount > 0 && (
                  <div className="flex items-center justify-between font-medium text-[#A01717]">
                    <dt>Promoções</dt>
                    <dd>-{currencyFormatter.format(promotionsDiscount)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-500">
                  <dt>Frete</dt>
                  <dd>
                    {freeShipping
                      ? "Grátis"
                      : currencyFormatter.format(deliveryFee)}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <dt>Total</dt>
                  <dd>
                    {currencyFormatter.format(
                      finalTotal + (freeShipping ? 0 : deliveryFee),
                    )}
                  </dd>
                </div>
              </dl>

              <Link
                href="/carrinho"
                onClick={onClose}
                className="mt-4 flex w-full items-center justify-center rounded-full bg-[#A01717] px-4 py-3 text-sm font-normal text-white transition hover:bg-[#C10000]"
              >
                Ver carrinho
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-normal text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 hover:cursor-pointer"
              >
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
