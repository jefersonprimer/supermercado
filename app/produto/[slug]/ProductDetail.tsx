"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Minus,
  Package,
  ListPlus,
  Check,
  ChevronLeft,
  Copy,
  Pencil,
  Plus,
  Share2,
  TicketPercent,
  Trash2,
  Truck,
  X,
  ZoomIn,
} from "lucide-react";
import ProductCarousel from "@/components/ProductCarousel";
import ProductFormModal from "@/components/ProductFormModal";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useCart } from "@/hooks/useCart";
import { getPromotedUnitPrice } from "@/lib/promotions";
import { getUnitPriceLabel } from "@/lib/product-unit-pricing";
import { categoryPath, departmentPath, slugify } from "@/lib/catalog";
import type { Coupon } from "@/types/coupon";
import type { Product } from "@/types/product";
import SubHeader from "@/components/SubHeader";
import ProductDetailSkeleton from "./ProductDetailSkeleton";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const SPECIFICATION_LABELS: Record<string, string> = {
  ean: "EAN",
  sku: "SKU",
  categoria_produtos: "Categoria",
  genero: "Gênero",
  tipo_produto: "Tipo de produto",
  tipo_embalagem: "Embalagem",
  fabricante: "Fabricante",
  composicao: "Composição",
  indicacoes_uso: "Indicações de uso",
  linha: "Linha",
  modo_uso: "Modo de uso",
};

export default function ProductDetail({
  initialProduct,
}: {
  initialProduct: Product;
}) {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const detailsRef = useRef<HTMLElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [listBusy, setListBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<{
    department: string;
    products: Product[];
  } | null>(null);

  const { items, addToCart, setCartQuantity } = useCart();

  useEffect(() => {
    let active = true;

    fetch("/api/coupons")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.coupons)) {
          setAvailableCoupons(data.coupons);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!slug) return;

    let active = true;

    async function loadProduct() {
      setLoading(!initialProduct);
      setNotFound(false);

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(slug)}`,
        );
        const data = await response.json();

        if (!active) return;

        if (response.ok && data.product) {
          setProduct(data.product);
          setActiveImage(0);
        } else {
          setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [slug, initialProduct]);

  useEffect(() => {
    if (!product?.name) return;

    document.title = `${product.name} | Fanfar Farmácia`;
  }, [product?.name]);

  useEffect(() => {
    if (!zoomOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [zoomOpen]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (active && response.ok) {
          setIsLoggedIn(Boolean(data.user));
          setIsAdmin(data.user?.role === "admin");
        }
      } catch (error) {
        console.error("Erro ao verificar usuário:", error);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!product?.id || !isLoggedIn) {
      setIsInList(false);
      return;
    }
    let active = true;
    fetch("/api/list")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data)
          setIsInList(
            data.items.some((item: { id: string }) => item.id === product.id),
          );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [product?.id, isLoggedIn]);

  const handleListToggle = async () => {
    if (!product || listBusy) return;
    if (!isLoggedIn) {
      router.push(
        `/login?next=${encodeURIComponent(`/produto/${product.slug}`)}`,
      );
      return;
    }
    setListBusy(true);
    try {
      const response = await fetch(
        isInList ? `/api/list/${product.id}` : "/api/list",
        {
          method: isInList ? "DELETE" : "POST",
          ...(isInList
            ? {}
            : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product.id }),
              }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Não foi possível atualizar sua lista.");
      setIsInList(!isInList);
      setShareMessage(
        isInList
          ? "Produto removido da sua lista."
          : "Produto adicionado à sua lista.",
      );
      window.setTimeout(() => setShareMessage(""), 2500);
    } catch (error) {
      setShareMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar sua lista.",
      );
    } finally {
      setListBusy(false);
    }
  };

  const handleShare = () => {
    if (!product) return;
    setShareModalOpen(true);
  };

  const copyShareLink = async () => {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Link do produto copiado.");
      window.setTimeout(() => setShareMessage(""), 2500);
      setShareModalOpen(false);
    } catch {
      setShareMessage("Não foi possível copiar o link.");
    }
  };

  useEffect(() => {
    const department = product?.department;
    const productId = product?.id;

    if (!department || !productId) return;

    let active = true;

    async function loadRelatedProducts(dept: string, currentId: string) {
      try {
        const response = await fetch(
          `/api/products?department=${encodeURIComponent(dept)}`,
        );
        const data = await response.json();

        if (active && response.ok && Array.isArray(data.products)) {
          const products = (data.products as Product[])
            .filter((item) => item.id !== currentId)
            .slice(0, 12);

          setRelatedProducts({ department: dept, products });
        }
      } catch (error) {
        console.error("Erro ao carregar produtos relacionados:", error);
      }
    }

    loadRelatedProducts(department, productId);

    return () => {
      active = false;
    };
  }, [product?.department, product?.id]);

  const handleProductSaved = (updatedProduct: Product) => {
    setProduct(updatedProduct);
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!product) return;

    if (!confirm(`Excluir o produto "${product.name}"?`)) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
        router.refresh();
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (notFound || !product) {
    return (
      <main className="flex-1 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
          <Package className="h-12 w-12 text-gray-300" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Produto não encontrado
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            O produto que você procura pode ter sido removido ou não existe.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-[#A01717] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#C10000]"
          >
            Voltar para a home
          </Link>
        </div>
      </main>
    );
  }

  const images = (product.images ?? []).filter(Boolean);
  const mainImage = images[activeImage];
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
  const promoBadge =
    product.promotional_badge ?? promotion?.badge_label ?? null;
  const requiresQuantity = promotion !== null && minQuantity > 1;
  const installmentPrice = product.installment_price ?? null;
  const installments = product.installments ?? 3;
  const hasInstallment = installmentPrice !== null && installments > 1;
  const inStock = product.stock > 0;
  const quantity =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;

  const related =
    relatedProducts && relatedProducts.department === product.department
      ? relatedProducts.products
      : [];

  const specifications = Object.entries(product.specifications ?? {}).filter(
    ([key, value]) =>
      key !== "quantidade_conteudo" &&
      key !== "unidade_conteudo" &&
      value !== null &&
      value !== undefined &&
      String(value).trim() !== "",
  );

  const increaseQuantity = () => setCartQuantity(product, quantity + 1);
  const decreaseQuantity = () => setCartQuantity(product, quantity - 1);
  const copyCouponCode = async (coupon: Coupon) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCouponId(coupon.id);
      window.setTimeout(() => setCopiedCouponId(null), 2000);
    } catch {
      setCopiedCouponId(null);
    }
  };

  return (
    <main className="flex-1 bg-white">
      <SubHeader />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="hidden lg:flex mb-6 items-center gap-1.5 text-xs text-gray-500">
          <Link
            href="/"
            className="flex items-center gap-1 hover:text-[#A01717] hover:underline"
          >
            Página Inicial
          </Link>
          {product.department && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <Link
                href={departmentPath(product.department)}
                className="truncate transition-colors hover:text-[#A01717] hover:underline"
              >
                {product.department}
              </Link>
            </>
          )}
          {product.department && product.category && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              <Link
                href={categoryPath(product.department, product.category)}
                className="truncate transition-colors hover:text-[#A01717] hover:underline"
              >
                {product.category}
              </Link>
            </>
          )}
          {product.department && product.category && product.subcategory && (
            <>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
              <Link
                href={`${categoryPath(product.department, product.category)}/${slugify(product.subcategory)}`}
                className="truncate transition-colors hover:text-[#A01717] hover:underline"
              >
                {product.subcategory}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <span className="truncate text-gray-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <div className="w-full max-w-md">
              <div
                className="relative flex aspect-square touch-pan-y items-center justify-center overflow-hidden rounded-2xl bg-white p-6"
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  if (touchStartX.current === null || images.length < 2) return;

                  const deltaX =
                    event.changedTouches[0].clientX - touchStartX.current;
                  touchStartX.current = null;

                  if (Math.abs(deltaX) < 40) return;
                  setActiveImage(
                    (current) =>
                      (current + (deltaX < 0 ? 1 : -1) + images.length) %
                      images.length,
                  );
                }}
              >
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Package
                    className="h-16 w-16 text-gray-300"
                    aria-hidden="true"
                  />
                )}
                {mainImage && (
                  <button
                    type="button"
                    onClick={() => setZoomOpen(true)}
                    className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm transition hover:border-[#A01717] hover:text-[#A01717]"
                    aria-label="Ampliar imagem do produto"
                    title="Ampliar imagem"
                  >
                    <ZoomIn className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          (current) =>
                            (current - 1 + images.length) % images.length,
                        )
                      }
                      className="absolute left-3 top-1/2 hidden sm:inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm transition hover:border-[#A01717] hover:text-[#A01717]"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveImage(
                          (current) => (current + 1) % images.length,
                        )
                      }
                      className="absolute right-3 top-1/2 hidden sm:inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm transition hover:border-[#A01717] hover:text-[#A01717]"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white p-1.5 transition ${
                        index === activeImage
                          ? "border-[#A01717] ring-1 ring-[#A01717]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      aria-label={`Ver imagem ${index + 1}`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
              {images.length > 1 && (
                <div
                  className="mt-3 flex items-center justify-center gap-2 sm:hidden"
                  aria-label="Imagens do produto"
                >
                  {images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === activeImage
                          ? "w-5 bg-[#A01717]"
                          : "w-2 bg-gray-300"
                      }`}
                      aria-label={`Ver imagem ${index + 1}`}
                      aria-current={index === activeImage ? "true" : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 lg:sticky lg:top-24 lg:mt-0 lg:self-start">
            <div className="flex flex-col items-start justify-between gap-3">
              {isAdmin && (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#A01717]/50 hover:text-[#A01717]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleting ? "Apagando..." : "Apagar"}
                  </button>
                </div>
              )}

              <h1 className="text-xl font-bold leading-tight text-gray-900">
                {product.name}
              </h1>
            </div>

            {product.brand && (
              <p className="mt-2 text-sm text-gray-500">
                Marca:{" "}
                <Link
                  href={`/marca/${slugify(product.brand)}`}
                  className="font-normal text-gray-700 transition-colors hover:text-[#A01717] hover:underline"
                >
                  {product.brand}
                </Link>
              </p>
            )}

            {product.description && (
              <div className="mt-6">
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {product.description}
                </p>
                {product.description.length > 180 && (
                  <button
                    type="button"
                    onClick={() =>
                      detailsRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      })
                    }
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#A01717] transition-colors hover:text-[#C10000] hover:underline"
                  >
                    Ver mais
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {(product.options ?? []).length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold text-gray-900">
                  Opções disponíveis
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(product.options ?? []).map((option) => (
                    <span
                      key={option.id ?? option.nome}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {option.nome}
                      {option.preco
                        ? ` — ${currencyFormatter.format(option.preco)}`
                        : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-start gap-2">
                {comparePrice !== null && (
                  <span className="block text-sm text-gray-400 line-through">
                    {currencyFormatter.format(comparePrice)}
                  </span>
                )}

                {promoBadge && (
                  <span className="mb-2 inline-flex rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    {promoBadge}
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold text-gray-900">
                {currencyFormatter.format(displayPrice)}
              </p>

              {unitPriceLabel && (
                <p className="mt-1 text-sm text-gray-500">{unitPriceLabel}</p>
              )}

              {requiresQuantity && (
                <p className="mt-1 text-sm font-semibold text-red-600">
                  Promoção válida a partir de {minQuantity} unidades.
                </p>
              )}

              {hasInstallment && installmentPrice !== null ? (
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-semibold text-gray-700">
                    {installments}x {currencyFormatter.format(installmentPrice)}
                  </span>{" "}
                  s/ juros
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">à vista</p>
              )}

              <div className="mt-5">
                {quantity === 0 ? (
                  <button
                    type="button"
                    onClick={() => addToCart(product, 1)}
                    disabled={!inStock}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#A01717] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#C10000] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 cursor-pointer"
                  >
                    Adicionar ao Carrinho
                  </button>
                ) : (
                  <div className="flex w-full items-center rounded-full border border-[#A01717]/25 bg-white p-1">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      aria-label="Diminuir quantidade"
                      className="flex flex-1 items-center justify-center rounded-full p-1 text-[#A01717] transition hover:bg-gray-100"
                    >
                      <Minus size={24} />
                    </button>
                    <span
                      aria-live="polite"
                      className="min-w-5 flex-1 border-l border-r border-gray-200 text-center text-sm font-medium text-[#363148]"
                    >
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                      aria-label="Aumentar quantidade"
                      className="flex flex-1 items-center justify-center rounded-full p-1 text-[#A01717] transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                )}
              </div>

              {availableCoupons.length > 0 && (
                <div className="mt-4 space-y-2" aria-label="Cupons disponíveis">
                  {availableCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="rounded-xl border border-gray-200 bg-white px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <TicketPercent className="h-4 w-4 shrink-0 text-[#A01717]" />
                          <span className="truncate text-sm font-bold text-[#A01717]">
                            {coupon.free_shipping
                              ? "Frete grátis"
                              : coupon.discount_type === "percentage"
                                ? `${coupon.discount_value}% OFF`
                                : `${currencyFormatter.format(coupon.discount_value)} OFF`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyCouponCode(coupon)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#A01717]/40 hover:text-[#A01717]"
                          aria-label={`Copiar cupom ${coupon.code}`}
                        >
                          {copiedCouponId === coupon.id ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copiedCouponId === coupon.id
                            ? "Copiado"
                            : coupon.code}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCouponId((current) =>
                            current === coupon.id ? null : coupon.id,
                          )
                        }
                        aria-expanded={expandedCouponId === coupon.id}
                        className="mt-2 flex w-full items-center justify-between text-left text-xs text-gray-500 transition hover:text-gray-700"
                      >
                        <span>Regras de uso</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${expandedCouponId === coupon.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expandedCouponId === coupon.id && (
                        <div className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
                          <p>Aplicável sobre o subtotal do carrinho.</p>
                          {coupon.min_purchase > 0 && (
                            <p>
                              Compra mínima:{" "}
                              {currencyFormatter.format(coupon.min_purchase)}
                            </p>
                          )}
                          {coupon.max_discount !== null &&
                            coupon.max_discount > 0 && (
                              <p>
                                Desconto máximo:{" "}
                                {currencyFormatter.format(coupon.max_discount)}
                              </p>
                            )}
                          {coupon.expires_at && (
                            <p>
                              Válido até{" "}
                              {new Date(coupon.expires_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          )}
                          {coupon.description && <p>{coupon.description}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#A01717]/50 hover:text-[#A01717] cursor-pointer"
                >
                  <Share2 size={20} /> Compartilhar
                </button>
                <button
                  type="button"
                  onClick={handleListToggle}
                  disabled={listBusy}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#A01717]/50 hover:text-[#A01717] disabled:opacity-60 cursor-pointer"
                >
                  {isInList ? <Check size={20} /> : <ListPlus size={20} />}
                  {listBusy
                    ? "Salvando..."
                    : isInList
                      ? "Na sua lista"
                      : "Adicionar à lista"}
                </button>
              </div>
              {shareMessage && (
                <p
                  aria-live="polite"
                  className="mt-2 text-center text-xs text-gray-500"
                >
                  {shareMessage}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                <Truck className="h-4 w-4" />
                Entrega em Frederico Westphalen e região
              </div>
            </div>
          </div>
        </div>

        {shareModalOpen && (
          <div
            className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget)
                setShareModalOpen(false);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-modal-title"
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-2xl sm:pb-6"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="share-modal-title"
                    className="text-xl font-bold text-gray-900"
                  >
                    Compartilhar
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Envie para quem vai comprar por você
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  aria-label="Fechar compartilhamento"
                  className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${product.name} ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShareModalOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                  Compartilhar pelo WhatsApp
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(`Olha este produto: ${product.name}`)}&body=${encodeURIComponent(`Oi! Encontrei este produto para você: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                  onClick={() => setShareModalOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-[#EA4335]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                  </svg>
                  Compartilhar pelo E-mail
                </a>
                <a
                  href={`https://x.com/intent/post?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShareModalOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-black"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z" />
                  </svg>
                  Compartilhar pelo X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShareModalOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-[#1877F2]"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                  </svg>
                  Compartilhar pelo Facebook
                </a>
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  <Copy className="h-5 w-5 text-gray-500" />
                  Copiar link
                </button>
              </div>
            </section>
          </div>
        )}

        {zoomOpen && mainImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Imagem ampliada: ${product.name}`}
            onClick={() => setZoomOpen(false)}
          >
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition hover:bg-gray-100"
              aria-label="Fechar imagem ampliada"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveImage(
                      (current) =>
                        (current - 1 + images.length) % images.length,
                    );
                  }}
                  className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition hover:bg-gray-100 sm:left-8"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveImage((current) => (current + 1) % images.length);
                  }}
                  className="absolute right-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg transition hover:bg-gray-100 sm:right-8"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
            <img
              src={mainImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>

      {related.length > 0 && product.department && (
        <ProductCarousel
          products={related}
          title="Similares que você pode se interessar"
        />
      )}

      {(product.description || specifications.length > 0) && (
        <section
          ref={detailsRef}
          id="detalhes-completos"
          className="scroll-mt-24 border-t border-gray-100 bg-gray-50"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
            {product.description && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-gray-900">
                  Descrição completa
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                  {product.description}
                </p>
              </div>
            )}

            {specifications.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
                <h2 className="text-base font-bold text-gray-900">
                  Especificações
                </h2>
                <dl className="mt-4 space-y-3">
                  {specifications.map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {SPECIFICATION_LABELS[key] ?? key}
                      </dt>
                      <dd className="mt-0.5 text-sm text-gray-700">
                        {String(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {editModalOpen && (
        <ProductFormModal
          product={product}
          onClose={() => setEditModalOpen(false)}
          onSaved={handleProductSaved}
        />
      )}
    </main>
  );
}
