"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Package,
  RotateCcw,
  Tag,
  X,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { slugify } from "@/lib/catalog";
import type { Product } from "@/types/product";

const PAGE_SIZE = 24;
const MAX_PAGE_BUTTONS = 10;

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const DISCOUNT_OPTIONS = [
  { value: 0, label: "Todos" },
  { value: 10, label: "10%+" },
  { value: 20, label: "20%+" },
  { value: 30, label: "30%+" },
  { value: 50, label: "50%+" },
];

function offerPrice(product: Product): number {
  const price = Number(product.price) || 0;
  const promotionalPrice =
    product.promotional_price == null
      ? null
      : Number(product.promotional_price);

  if (promotionalPrice !== null && promotionalPrice < price) {
    return promotionalPrice;
  }

  return price;
}

function discountPercentage(product: Product): number {
  const price = Number(product.price) || 0;
  if (price <= 0) return 0;

  const promotionalPrice =
    product.promotional_price == null
      ? null
      : Number(product.promotional_price);

  if (promotionalPrice !== null && promotionalPrice < price) {
    return Math.round((1 - promotionalPrice / price) * 100);
  }

  const originalPrice =
    product.original_price == null ? null : Number(product.original_price);

  if (originalPrice !== null && originalPrice > price) {
    return Math.round((1 - price / originalPrice) * 100);
  }

  return 0;
}

function isOffer(product: Product): boolean {
  return (
    Boolean(product.promotion) ||
    product.promotional_price != null ||
    discountPercentage(product) > 0
  );
}

function buildPageItems(totalPages: number, currentPage: number) {
  if (totalPages <= MAX_PAGE_BUTTONS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 6) {
    return [1, 2, 3, 4, 5, 6, 7, "...", totalPages] as const;
  }

  if (currentPage >= totalPages - 4) {
    return [
      1,
      "...",
      ...Array.from({ length: 8 }, (_, index) => totalPages - 7 + index),
    ] as const;
  }

  return [
    1,
    "...",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "...",
    totalPages,
  ] as const;
}

export default function OffersView({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [minDiscount, setMinDiscount] = useState(0);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const productsTopRef = useRef<HTMLDivElement | null>(null);

  const toggleFilterSection = (section: string) => {
    setOpenFilterSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setLoading(initialProducts.length === 0);
      setError(null);

      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!active) return;

        if (!response.ok) {
          throw new Error(data.error ?? "Erro ao carregar ofertas.");
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch {
        if (active) {
          setError("Não foi possível carregar as ofertas. Tente novamente.");
          setProducts([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, [initialProducts.length]);

  const offerProducts = useMemo(
    () => products.filter((product) => isOffer(product)),
    [products],
  );

  const departments = useMemo(() => {
    const names = new Set<string>();

    offerProducts.forEach((product) => {
      if (product.department) names.add(product.department);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [offerProducts]);

  const departmentProducts = useMemo(() => {
    if (!selectedDepartment) return offerProducts;

    return offerProducts.filter(
      (product) =>
        slugify(product.department ?? "") === slugify(selectedDepartment),
    );
  }, [offerProducts, selectedDepartment]);

  const categories = useMemo(() => {
    const names = new Set<string>();

    departmentProducts.forEach((product) => {
      if (product.category) names.add(product.category);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [departmentProducts]);

  const scopeProducts = useMemo(() => {
    if (!selectedCategory) return departmentProducts;

    return departmentProducts.filter(
      (product) =>
        slugify(product.category ?? "") === slugify(selectedCategory),
    );
  }, [departmentProducts, selectedCategory]);

  const brands = useMemo(() => {
    const names = new Set<string>();

    scopeProducts.forEach((product) => {
      const brand = product.brand?.trim();
      if (brand) names.add(brand);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [scopeProducts]);

  const priceBounds = useMemo(() => {
    const prices = scopeProducts
      .map((product) => offerPrice(product))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [scopeProducts]);

  const filteredProducts = useMemo(() => {
    const min = priceMin.trim() === "" ? null : Number(priceMin);
    const max = priceMax.trim() === "" ? null : Number(priceMax);

    return scopeProducts.filter((product) => {
      const brand = product.brand?.trim() ?? "";

      if (selectedBrands.length > 0 && !selectedBrands.includes(brand)) {
        return false;
      }

      const price = offerPrice(product);

      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;

      if (minDiscount > 0 && discountPercentage(product) < minDiscount) {
        return false;
      }

      if (onlyInStock && !(Number(product.stock) > 0)) return false;

      return true;
    });
  }, [
    scopeProducts,
    selectedBrands,
    priceMin,
    priceMax,
    minDiscount,
    onlyInStock,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const pageProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, safePage]);

  const activeFilters =
    (selectedDepartment ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    (priceMin.trim() ? 1 : 0) +
    (priceMax.trim() ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const isFiltering =
    selectedDepartment !== null ||
    selectedCategory !== null ||
    selectedBrands.length > 0 ||
    priceMin.trim() !== "" ||
    priceMax.trim() !== "" ||
    minDiscount > 0 ||
    onlyInStock;

  const toggleBrand = (brand: string) => {
    setSelectedBrands((previous) =>
      previous.includes(brand)
        ? previous.filter((item) => item !== brand)
        : [...previous, brand],
    );
    setCurrentPage(1);
  };

  const selectCategory = (category: string | null) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const updatePriceMin = (value: string) => {
    setPriceMin(value);
    setCurrentPage(1);
  };

  const updatePriceMax = (value: string) => {
    setPriceMax(value);
    setCurrentPage(1);
  };

  const updateMinDiscount = (value: number) => {
    setMinDiscount(value);
    setCurrentPage(1);
  };

  const updateStockFilter = (checked: boolean) => {
    setOnlyInStock(checked);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page === safePage) return;

    setCurrentPage(page);
    productsTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const clearFilters = () => {
    setSelectedDepartment(null);
    setSelectedCategory(null);
    setSelectedBrands([]);
    setPriceMin("");
    setPriceMax("");
    setMinDiscount(0);
    setOnlyInStock(false);
    setCurrentPage(1);
  };

  const selectDepartment = (department: string | null) => {
    setSelectedDepartment(department);
    setSelectedCategory(null);
    setSelectedBrands([]);
    setCurrentPage(1);
  };

  const pageItems = buildPageItems(totalPages, safePage);

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#279236] hover:underline"
          >
            Início
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <span className="font-medium text-gray-700">Ofertas</span>
        </nav>

        <div className="mt-4 flex items-start justify-between gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              <Tag size={24} aria-hidden="true" />
              Ofertas
            </h1>
            <p className="mt-1 hidden text-sm text-gray-500 sm:block">
              {loading
                ? "Carregando ofertas..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1
                      ? "oferta encontrada"
                      : "ofertas encontradas"
                  }`}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setFiltersOpen((previous) => !previous)}
            className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#279236]/40 hover:text-[#279236] lg:hidden"
          >
            {filtersOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            Filtros
            {activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#279236] px-1 text-[11px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {filtersOpen && (
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setFiltersOpen(false)}
            className="fixed inset-0 z-[79] bg-black/40 sm:hidden"
          />
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside
            className={`${
              filtersOpen ? "block" : "hidden"
            } fixed inset-x-0 bottom-0 z-[80] max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.16)] sm:static sm:z-auto sm:max-h-none sm:overflow-visible sm:rounded-none sm:bg-transparent sm:shadow-none lg:sticky lg:top-24 lg:block lg:self-start`}
          >
            <div className="space-y-6 rounded-t-3xl border border-gray-200 bg-white p-4 sm:rounded-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Filter size={20} />
                  Filtros
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!isFiltering}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#279236] transition hover:text-[#1f7a2b] disabled:cursor-not-allowed disabled:text-gray-300"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Fechar filtros"
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 sm:hidden"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleFilterSection("departments")}
                  aria-expanded={Boolean(openFilterSections.departments)}
                  className="flex w-full items-center justify-between py-1 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Departamentos
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.departments ? "rotate-180" : ""}`}
                  />
                </button>
                {openFilterSections.departments && (
                  <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    <li>
                      <button
                        type="button"
                        onClick={() => selectDepartment(null)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                          !selectedDepartment
                            ? "bg-[#279236] font-semibold text-white"
                            : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"
                        }`}
                      >
                        Todas as ofertas
                      </button>
                    </li>
                    {departments.map((department) => (
                      <li key={department}>
                        <button
                          type="button"
                          onClick={() => selectDepartment(department)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                            selectedDepartment === department
                              ? "bg-[#279236] font-semibold text-white"
                              : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"
                          }`}
                        >
                          <span className="truncate">{department}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {categories.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleFilterSection("categories")}
                    aria-expanded={Boolean(openFilterSections.categories)}
                    className="flex w-full items-center justify-between py-1 text-left"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Categorias
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.categories ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFilterSections.categories && (
                    <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      <li>
                        <button
                          type="button"
                          onClick={() => selectCategory(null)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                            !selectedCategory
                              ? "bg-[#279236] font-semibold text-white"
                              : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"
                          }`}
                        >
                          Todas as categorias
                        </button>
                      </li>
                      {categories.map((category) => (
                        <li key={category}>
                          <button
                            type="button"
                            onClick={() => selectCategory(category)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${
                              selectedCategory === category
                                ? "bg-[#279236] font-semibold text-white"
                                : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"
                            }`}
                          >
                            <span className="truncate">{category}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {brands.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleFilterSection("brands")}
                    aria-expanded={Boolean(openFilterSections.brands)}
                    className="flex w-full items-center justify-between py-1 text-left"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Marcas
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.brands ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFilterSections.brands && (
                    <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {brands.map((brand) => (
                        <li key={brand}>
                          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={selectedBrands.includes(brand)}
                              onChange={() => toggleBrand(brand)}
                              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#279236]"
                            />
                            <span className="truncate">{brand}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => toggleFilterSection("price")}
                  aria-expanded={Boolean(openFilterSections.price)}
                  className="flex w-full items-center justify-between py-1 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Faixa de preço
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.price ? "rotate-180" : ""}`}
                  />
                </button>
                {openFilterSections.price && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={priceMin}
                        onChange={(event) => updatePriceMin(event.target.value)}
                        placeholder={
                          priceBounds ? `R$ ${priceBounds.min}` : "Mín."
                        }
                        aria-label="Preço mínimo"
                        className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                      />
                      <span className="text-xs text-gray-400">até</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={priceMax}
                        onChange={(event) => updatePriceMax(event.target.value)}
                        placeholder={
                          priceBounds ? `R$ ${priceBounds.max}` : "Máx."
                        }
                        aria-label="Preço máximo"
                        className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                      />
                    </div>
                    {priceBounds && (
                      <p className="mt-2 text-[11px] text-gray-400">
                        Ofertas de {currencyFormatter.format(priceBounds.min)}{" "}
                        até {currencyFormatter.format(priceBounds.max)}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleFilterSection("discount")}
                  aria-expanded={Boolean(openFilterSections.discount)}
                  className="flex w-full items-center justify-between py-1 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Desconto mínimo
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.discount ? "rotate-180" : ""}`}
                  />
                </button>
                {openFilterSections.discount && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {DISCOUNT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateMinDiscount(option.value)}
                        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                          minDiscount === option.value
                            ? "border-[#279236] bg-[#279236] text-white"
                            : "border-gray-200 text-gray-600 hover:border-[#279236]/40 hover:text-[#279236]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => toggleFilterSection("availability")}
                  aria-expanded={Boolean(openFilterSections.availability)}
                  className="flex w-full items-center justify-between py-1 text-left"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Disponibilidade
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.availability ? "rotate-180" : ""}`}
                  />
                </button>
                {openFilterSections.availability && (
                  <div className="mt-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={onlyInStock}
                        onChange={(event) =>
                          updateStockFilter(event.target.checked)
                        }
                        className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#279236]"
                      />
                      <span>Somente em estoque</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            <div ref={productsTopRef} className="scroll-mt-24" />

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-2xl bg-gray-200"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
                <Package className="h-12 w-12 text-gray-300" />
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  Não foi possível carregar as ofertas
                </h2>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <Tag className="h-12 w-12 text-gray-300" />
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  Nenhuma oferta encontrada
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros para ver outras ofertas.
                </p>
                {isFiltering && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#279236] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7a2b]"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {pageProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav
                    aria-label="Paginação das ofertas"
                    className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage === 1}
                      aria-label="Página anterior"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#279236]/40 hover:text-[#279236] disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {pageItems.map((item, index) =>
                      typeof item === "number" ? (
                        <button
                          key={item}
                          type="button"
                          onClick={() => goToPage(item)}
                          aria-current={item === safePage ? "page" : undefined}
                          className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm font-semibold transition ${
                            item === safePage
                              ? "border-[#279236] bg-[#279236] text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-[#279236]/40 hover:text-[#279236]"
                          }`}
                        >
                          {item}
                        </button>
                      ) : (
                        <span
                          key={`ellipsis-${index}`}
                          className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
                          aria-hidden="true"
                        >
                          {item}
                        </span>
                      ),
                    )}

                    <button
                      type="button"
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage === totalPages}
                      aria-label="Próxima página"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-[#279236]/40 hover:text-[#279236] disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </nav>
                )}

                <p className="mt-3 text-center text-xs text-gray-500">
                  Página {safePage} de {totalPages} • {filteredProducts.length}{" "}
                  {filteredProducts.length === 1 ? "oferta" : "ofertas"}
                </p>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
