"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  Package,
  RotateCcw,
  X,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { DEPARTMENTS } from "@/lib/departments";
import {
  findCategoryBySlug,
  findDepartmentBySlug,
  slugify,
  titleFromSlug,
} from "@/lib/catalog";
import type { Product } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface CatalogViewProps {
  initialProducts?: Product[];
  departmentSlug?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  brandSlug?: string;
  searchQuery?: string;
}

export default function CatalogView({
  initialProducts = [],
  departmentSlug,
  categorySlug,
  subcategorySlug,
  brandSlug,
  searchQuery,
}: CatalogViewProps) {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

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
          throw new Error(data.error ?? "Erro ao carregar produtos.");
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch {
        if (active) {
          setError("Não foi possível carregar os produtos. Tente novamente.");
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

  const configDepartment = useMemo(
    () => (departmentSlug ? findDepartmentBySlug(departmentSlug) : null),
    [departmentSlug],
  );

  const departmentName = configDepartment?.name ?? null;
  const normalizedSearch = slugify(searchQuery?.trim() ?? "");

  const baseProducts = useMemo(() => {
    if (searchQuery) {
      return products.filter((product) => {
        const searchableText = [product.name, product.description, product.brand, product.department, product.category, product.subcategory]
          .filter(Boolean)
          .map((value) => slugify(value ?? ""))
          .join(" ");

        return searchableText.includes(normalizedSearch) &&
          (!selectedDepartment || product.department === selectedDepartment);
      });
    }
    if (!departmentSlug) return products;

    return products.filter(
      (product) => slugify(product.department ?? "") === departmentSlug,
    );
  }, [products, departmentSlug, searchQuery, normalizedSearch, selectedDepartment]);

  const categoryName = useMemo(() => {
    if (!categorySlug) return null;

    if (departmentName) {
      const fromConfig = findCategoryBySlug(departmentName, categorySlug);
      if (fromConfig) return fromConfig;
    }

    return (
      baseProducts.find(
        (product) => slugify(product.category ?? "") === categorySlug,
      )?.category ?? null
    );
  }, [categorySlug, departmentName, baseProducts]);

  const brandName = useMemo(
    () =>
      products
        .find((product) => slugify(product.brand?.trim() ?? "") === brandSlug)
        ?.brand?.trim() ?? null,
    [products, brandSlug],
  );

  const pageTitle =
    (searchQuery ? `Busca: ${searchQuery}` : null) ??
    brandName ??
    (subcategorySlug ? titleFromSlug(subcategorySlug) : null) ??
    categoryName ??
    departmentName ??
    (categorySlug
      ? titleFromSlug(categorySlug)
      : departmentSlug
        ? titleFromSlug(departmentSlug)
        : "Todos os produtos");

  const departments = useMemo(() => {
    const names = new Set<string>();

    products.forEach((product) => {
      if (product.department) names.add(product.department);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const categories = useMemo(() => {
    if (searchQuery && selectedDepartment) {
      return [...new Set(baseProducts.map((product) => product.category).filter((name): name is string => Boolean(name)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    if (!departmentSlug) return [];

    const names = new Set<string>();

    configDepartment?.categories.forEach((category) => names.add(category));
    baseProducts.forEach((product) => {
      if (product.category) names.add(product.category);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [departmentSlug, configDepartment, baseProducts, searchQuery, selectedDepartment]);

  const brands = useMemo(() => {
    const names = new Set<string>();

    baseProducts.forEach((product) => {
      const brand = product.brand?.trim();
      if (brand) names.add(brand);
    });

    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [baseProducts]);

  const priceBounds = useMemo(() => {
    const prices = baseProducts
      .map((product) => Number(product.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) return null;

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [baseProducts]);

  const categoryProducts = useMemo(() => {
    if (searchQuery && selectedCategory) {
      return baseProducts.filter((product) => product.category === selectedCategory);
    }
    if (brandSlug) {
      return baseProducts.filter(
        (product) => slugify(product.brand?.trim() ?? "") === brandSlug,
      );
    }
    if (!categorySlug) return baseProducts;

    return baseProducts.filter(
      (product) => slugify(product.category ?? "") === categorySlug,
    );
  }, [baseProducts, categorySlug, brandSlug, searchQuery, selectedCategory]);

  const subcategories = useMemo(() => {
    if (searchQuery && selectedCategory) {
      return [...new Set(categoryProducts.map((product) => product.subcategory).filter((name): name is string => Boolean(name)))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }
    if (!categorySlug) return [];
    const names = new Set<string>();
    const department = DEPARTMENTS.find((item) => item.name === departmentName);
    if (categoryName)
      department?.subcategories?.[categoryName]?.forEach((name) =>
        names.add(name),
      );
    categoryProducts.forEach((product) => {
      if (product.subcategory) names.add(product.subcategory);
    });
    return [...names];
  }, [categorySlug, departmentName, categoryName, categoryProducts, searchQuery, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const min = priceMin.trim() === "" ? null : Number(priceMin);
    const max = priceMax.trim() === "" ? null : Number(priceMax);

    return categoryProducts.filter((product) => {
      if (
        (subcategorySlug && slugify(product.subcategory ?? "") !== subcategorySlug) ||
        (searchQuery && selectedSubcategory && product.subcategory !== selectedSubcategory)
      )
        return false;
      const brand = product.brand?.trim() ?? "";

      if (selectedBrands.length > 0 && !selectedBrands.includes(brand)) {
        return false;
      }

      const price = Number(product.price);

      if (min !== null && Number.isFinite(min) && price < min) return false;
      if (max !== null && Number.isFinite(max) && price > max) return false;

      if (onlyOffers) {
        const originalPrice =
          product.original_price == null
            ? null
            : Number(product.original_price);
        const hasOriginalDiscount =
          originalPrice !== null &&
          Number.isFinite(originalPrice) &&
          originalPrice > price;
        const hasPromotion = Boolean(product.promotion);

        if (!hasOriginalDiscount && !hasPromotion) {
          return false;
        }
      }

      if (onlyInStock && !(Number(product.stock) > 0)) return false;

      return true;
    });
  }, [
    categoryProducts,
    subcategorySlug,
    searchQuery,
    selectedSubcategory,
    selectedBrands,
    priceMin,
    priceMax,
    onlyOffers,
    onlyInStock,
  ]);

  const activeFilters =
    selectedBrands.length +
    (selectedDepartment ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    (priceMin.trim() ? 1 : 0) +
    (priceMax.trim() ? 1 : 0) +
    (onlyOffers ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const currentDepartmentPath = departmentSlug
    ? `/departamento/${departmentSlug}`
    : "/departamento";

  const toggleBrand = (brand: string) => {
    setSelectedBrands((previous) =>
      previous.includes(brand)
        ? previous.filter((item) => item !== brand)
        : [...previous, brand],
    );
  };

  const toggleFilterSection = (section: string) => {
    setOpenFilterSections((previous) => ({
      ...previous,
      [section]: !previous[section],
    }));
  };

  const clearFilters = () => {
    setSelectedBrands([]);
    setSelectedDepartment("");
    setSelectedCategory("");
    setSelectedSubcategory("");
    setPriceMin("");
    setPriceMax("");
    setOnlyOffers(false);
    setOnlyInStock(false);

    if (categorySlug) {
      router.push(currentDepartmentPath);
    }
  };

  return (
    <main className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#1f7a2b] hover:underline"
          >
            Início
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          {searchQuery ? (
            <span>Busca</span>
          ) : (
            <Link
              href="/departamento"
              className="transition-colors hover:text-[#1f7a2b] hover:underline"
            >
              Departamento
            </Link>
          )}

          {departmentSlug && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              {categorySlug ? (
                <Link
                  href={currentDepartmentPath}
                  className="transition-colors hover:text-[#1f7a2b] hover:underline"
                >
                  {departmentName ?? titleFromSlug(departmentSlug)}
                </Link>
              ) : (
                <span className="font-medium hover:text-[#1f7a2b] hover:underline cursor-pointer">
                  {departmentName ?? titleFromSlug(departmentSlug)}
                </span>
              )}
            </>
          )}

          {categorySlug && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
              <span className="font-medium hover:text-[#1f7a2b] hover:underline">
                {categoryName ?? titleFromSlug(categorySlug)}
              </span>
            </>
          )}
        </nav>

        <div className="mt-4 flex items-start justify-between gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-1 hidden text-sm text-gray-500 sm:block">
              {loading
                ? "Carregando produtos..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1
                      ? "produto encontrado"
                      : "produtos encontrados"
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
                    disabled={activeFilters === 0 && !categorySlug}
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
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDepartment("");
                            setSelectedCategory("");
                            setSelectedSubcategory("");
                          }}
                          className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${!selectedDepartment ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                        >
                          Todos os departamentos
                        </button>
                      ) : (
                        <Link
                          href="/departamento"
                          className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${!departmentSlug ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                        >
                          <span>Todos os produtos</span>
                        </Link>
                      )}
                    </li>
                    {departments.map((department) => {
                      const isActive = searchQuery
                        ? department === selectedDepartment
                        : slugify(department) === departmentSlug;

                      return (
                        <li key={department}>
                          {searchQuery ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDepartment(department);
                                setSelectedCategory("");
                                setSelectedSubcategory("");
                              }}
                              className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${isActive ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                            >
                              <span className="truncate">{department}</span>
                            </button>
                          ) : (
                            <Link
                              href={`/departamento/${slugify(department)}`}
                              className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                            >
                              <span className="truncate">{department}</span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {(departmentSlug || (searchQuery && selectedDepartment)) && categories.length > 0 && (
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
                        {searchQuery ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory("");
                              setSelectedSubcategory("");
                            }}
                            className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${!selectedCategory ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                          >
                            Todas as categorias
                          </button>
                        ) : (
                          <Link
                            href={currentDepartmentPath}
                            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${!categorySlug ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                          >
                            <span>Todas as categorias</span>
                          </Link>
                        )}
                      </li>
                      {categories.map((category) => {
                        const isActive = searchQuery
                          ? category === selectedCategory
                          : slugify(category) === categorySlug;

                        return (
                          <li key={category}>
                            {searchQuery ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setSelectedSubcategory("");
                                }}
                                className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors ${isActive ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                              >
                                <span className="truncate">{category}</span>
                              </button>
                            ) : (
                              <Link
                                href={`${currentDepartmentPath}/${slugify(category)}`}
                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${isActive ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                              >
                                <span className="truncate">{category}</span>
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {(categorySlug || (searchQuery && selectedCategory)) && subcategories.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleFilterSection("subcategories")}
                    aria-expanded={Boolean(openFilterSections.subcategories)}
                    className="flex w-full items-center justify-between py-1 text-left"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      Subcategorias
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.subcategories ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFilterSections.subcategories && (
                    <ul className="mt-2 space-y-0.5">
                      {subcategories.map((subcategory) => (
                        <li key={subcategory}>
                          {searchQuery ? (
                            <button
                              type="button"
                              onClick={() => setSelectedSubcategory(selectedSubcategory === subcategory ? "" : subcategory)}
                              className={`w-full rounded-lg px-2.5 py-1.5 text-left text-sm ${selectedSubcategory === subcategory ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                            >
                              {subcategory}
                            </button>
                          ) : (
                            <Link
                              href={`${currentDepartmentPath}/${categorySlug}/${slugify(subcategory)}`}
                              className={`block rounded-lg px-2.5 py-1.5 text-sm ${slugify(subcategory) === subcategorySlug ? "bg-[#279236] font-semibold text-white" : "text-gray-600 hover:bg-gray-50 hover:text-[#279236]"}`}
                            >
                              {subcategory}
                            </Link>
                          )}
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
                        onChange={(event) => setPriceMin(event.target.value)}
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
                        onChange={(event) => setPriceMax(event.target.value)}
                        placeholder={
                          priceBounds ? `R$ ${priceBounds.max}` : "Máx."
                        }
                        aria-label="Preço máximo"
                        className="w-full min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-sm text-gray-900 transition focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#279236]"
                      />
                    </div>
                    {priceBounds && (
                      <p className="mt-2 text-[11px] text-gray-400">
                        Produtos de {currencyFormatter.format(priceBounds.min)}{" "}
                        até {currencyFormatter.format(priceBounds.max)}
                      </p>
                    )}
                  </>
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
                    Ofertas e estoque
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFilterSections.availability ? "rotate-180" : ""}`}
                  />
                </button>
                {openFilterSections.availability && (
                  <div className="space-y-1.5">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={onlyOffers}
                        onChange={(event) =>
                          setOnlyOffers(event.target.checked)
                        }
                        className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#279236]"
                      />
                      <span>Somente ofertas</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={onlyInStock}
                        onChange={(event) =>
                          setOnlyInStock(event.target.checked)
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
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
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
                  Não foi possível carregar os produtos
                </h2>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
                <Package className="h-12 w-12 text-gray-300" />
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  Nenhum produto encontrado
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros ou escolher outra categoria.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#279236] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f7a2b]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
