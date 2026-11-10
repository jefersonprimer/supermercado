"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import {
  User as UserIcon,
  ShoppingBag,
  Search,
  LogOut,
  Shield,
  ChevronDown,
  ChevronLeft,
  Package,
  PackageCheck,
  ListChecks,
  Plus,
  Tag,
  Menu,
  X,
  ShoppingBasket,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import type { Product } from "@/types/product";
import { useCart } from "@/hooks/useCart";
import CartSidebar from "@/components/CartSidebar";
import { DEPARTMENTS } from "@/lib/departments";
import { slugify } from "@/lib/catalog";
import { getPromotedUnitPrice } from "@/lib/promotions";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getProductBadge(product: Product) {
  const promotion = product.promotion ?? null;
  const minQuantity = promotion?.min_quantity ?? 1;
  const unitPrice = Number(product.price);
  const promotedUnitPrice = promotion
    ? getPromotedUnitPrice(promotion, unitPrice)
    : unitPrice;
  const promoAppliesAtOne =
    promotion !== null && minQuantity <= 1 && promotedUnitPrice < unitPrice;

  return (
    product.promotional_badge ??
    promotion?.badge_label ??
    (product.is_new ? "Novidade" : null) ??
    (promotion && minQuantity > 1
      ? `Leve ${minQuantity}+`
      : promoAppliesAtOne
        ? "Oferta"
        : null)
  );
}

function isNewProductBadge(badgeText: string) {
  const normalized = badgeText.toLocaleLowerCase("pt-BR");
  return normalized === "novidade" || normalized === "acabou de chegar";
}

function getSearchBadgeClass(badgeText: string, mobile = false) {
  return isNewProductBadge(badgeText)
    ? `absolute left-1 top-1 rounded-br-xl rounded-tl-xl bg-[#279236] ${mobile ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"} font-black uppercase tracking-wide text-white shadow-md`
    : `absolute ${mobile ? "right-0.5 top-0.5 px-1.5 py-0.5 text-[8px]" : "right-1 top-1 px-2 py-0.5 text-[9px]"} rounded-full bg-red-500 font-bold uppercase tracking-wide text-white shadow-sm`;
}

function ProductSearchSkeleton({
  mobile = false,
  dark = false,
}: {
  mobile?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      role="status"
      aria-label="Carregando produtos"
      className={
        mobile
          ? `divide-y ${dark ? "divide-white/10" : "divide-gray-100"}`
          : "py-1"
      }
    >
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className={`flex items-center gap-3 ${mobile ? "px-4 py-3" : "px-3 py-2.5"}`}
        >
          <div
            className={`shrink-0 animate-pulse rounded-lg ${dark ? "bg-white/10" : "bg-gray-100"} ${mobile ? "h-16 w-16" : "h-24 w-24"}`}
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div
              className={`h-3 w-4/5 animate-pulse rounded ${dark ? "bg-white/10" : "bg-gray-100"}`}
            />
            <div
              className={`h-3 w-1/3 animate-pulse rounded ${dark ? "bg-white/10" : "bg-gray-100"}`}
            />
          </div>
        </div>
      ))}
      <span className="sr-only">Buscando produtos...</span>
    </div>
  );
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  theme?: "light" | "dark";
  logoSrc?: string;
  logoAlt?: string;
}

const darkClassReplacements: Record<string, string> = {
  "bg-white": "bg-black",
  "bg-gray-50": "bg-white/5",
  "bg-gray-100": "bg-white/10",
  "bg-gray-200": "bg-white/15",
  "bg-gray-50/70": "bg-white/5",
  "bg-red-50": "bg-red-500/10",
  "border-gray-100": "border-white/10",
  "border-gray-200": "border-white/10",
  "border-gray-300": "border-white/20",
  "divide-gray-100": "divide-white/10",
  "text-gray-900": "text-white",
  "text-gray-800": "text-white/80",
  "text-gray-700": "text-white/70",
  "text-gray-600": "text-white/60",
  "text-gray-500": "text-white/50",
  "text-gray-400": "text-white/40",
  "text-gray-300": "text-white/30",
  "text-red-600": "text-red-400",
  "hover:bg-gray-50": "hover:bg-white/10",
  "hover:bg-gray-100": "hover:bg-white/10",
  "hover:bg-gray-200": "hover:bg-white/15",
  "hover:bg-red-50": "hover:bg-red-500/10",
  "hover:text-gray-900": "hover:text-white",
  "hover:text-gray-700": "hover:text-white/80",
  "hover:border-gray-300": "hover:border-white/20",
  "hover:text-red-600": "hover:text-red-400",
  "group-hover:text-red-500": "group-hover:text-red-400",
  "focus:bg-white": "focus:bg-zinc-900",
};

function applyHeaderTheme(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child))
      return child;

    const className = child.props.className?.replace(
      /\S+/g,
      (token) => darkClassReplacements[token] ?? token,
    );

    return cloneElement(child, {
      ...(className ? { className } : {}),
      children: applyHeaderTheme(child.props.children),
    });
  });
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function Header({
  onSearch,
  theme = "light",
  logoSrc = "/logo-name.png",
  logoAlt = "Supermercado Bertoletti",
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount: cartItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileNavSection, setMobileNavSection] = useState<
    "departments" | "services" | null
  >(null);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
      }
    };

    fetchUser();
  }, [pathname]);

  // Busca produtos no header com debounce
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 3) return;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setSearching(true);

      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(term)}&limit=8&suggestions=1`,
          { signal: controller.signal },
        );
        const data = await response.json();

        if (controller.signal.aborted) return;

        setSearchResults(response.ok ? (data.products ?? []) : []);
        setSearchOpen(true);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Erro ao buscar produtos:", error);
          setSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [searchQuery]);

  // Fecha o dropdown de busca ao clicar fora ou pressionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dropdownOpen || window.matchMedia("(min-width: 640px)").matches)
      return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setDropdownOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Erro ao deslogar:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    onSearch?.(query);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    router.push(`/busca?q=${encodeURIComponent(query)}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (value.trim().length < 3) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(false);
    setSearching(false);
  };

  const displayName = user
    ? user.name?.trim() || user.email?.split("@")[0] || "Usuário"
    : null;

  const content = (
    <header
      className={`sticky top-0 z-50 w-full shadow-sm border-b ${theme === "dark" ? "bg-black border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.6)]" : "bg-white border-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-6">
          {/* Menu e logo ficam juntos em telas pequenas */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir navegação"
              aria-expanded={mobileNavOpen}
              className="sm:hidden -ml-2 rounded-full p-2 text-gray-700 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex shrink-0 items-center">
              <Image
                src="/logo.png"
                alt={logoAlt}
                width={160}
                height={50}
                priority
                className="h-10 w-auto object-contain sm:hidden"
              />
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={160}
                height={50}
                priority
                className="hidden h-12 w-auto object-contain sm:block"
              />
            </Link>
          </div>

          {mobileNavOpen && (
            <div
              className="fixed inset-0 z-[100] sm:hidden"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget)
                  setMobileNavOpen(false);
              }}
            >
              <div className="absolute inset-0 bg-gray-950/50" />
              <aside
                role="dialog"
                aria-modal="true"
                aria-label="Navegação principal"
                className="absolute inset-y-0 left-0 flex w-full flex-col bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                  <span className="text-base font-bold text-gray-900">
                    Navegação
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="Fechar navegação"
                    className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-3 text-sm">
                  <div className="space-y-1 border-b border-gray-100 pb-3">
                    <Link
                      href="/cupons"
                      onClick={() => setMobileNavOpen(false)}
                      className="block rounded-lg px-3 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Cupons
                    </Link>

                    <Link
                      href="/ofertas"
                      onClick={() => setMobileNavOpen(false)}
                      className="block rounded-lg px-3 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Ofertas Exclusivas
                    </Link>
                    <Link
                      href="/black-week"
                      onClick={() => setMobileNavOpen(false)}
                      className="block rounded-lg px-3 py-2.5 font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      Black Week
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileNavSection("departments")}
                    className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-3 text-left font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Departamentos
                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileNavSection("services")}
                    className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-3 text-left font-semibold text-gray-800 hover:bg-gray-50"
                  >
                    Serviços de Saúde
                    <ChevronDown className="h-4 w-4 -rotate-90 text-gray-400" />
                  </button>
                </nav>
                {mobileNavSection && (
                  <section
                    className="absolute inset-0 z-10 flex flex-col bg-white"
                    role="dialog"
                    aria-modal="true"
                    aria-label={
                      mobileNavSection === "departments"
                        ? "Departamentos"
                        : "Serviços de Saúde"
                    }
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setMobileNavSection(null)}
                        aria-label="Voltar à navegação"
                        className="flex min-w-0 items-center gap-1 rounded-lg py-1 pr-2 text-left text-base font-bold text-gray-900 hover:bg-gray-50"
                      >
                        <ChevronLeft className="h-5 w-5 shrink-0" />
                        {mobileNavSection === "departments"
                          ? "Departamentos"
                          : "Serviços de Saúde"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileNavSection(null);
                          setMobileNavOpen(false);
                        }}
                        aria-label="Fechar navegação"
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-4 py-3 text-sm">
                      {mobileNavSection === "departments"
                        ? DEPARTMENTS.map((department) => (
                            <Link
                              key={department.name}
                              href={`/departamento/${slugify(department.name)}`}
                              onClick={() => {
                                setMobileNavSection(null);
                                setMobileNavOpen(false);
                              }}
                              className="block rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50"
                            >
                              {department.name}
                            </Link>
                          ))
                        : [
                            "Vacinas",
                            "Teste de COVID",
                            "Serviços farmacêuticos",
                            "Exames clínicos",
                            "Telessaúde",
                            "Manipulação",
                            "Jornada saudável na Vitat",
                            "Dose Certa",
                          ].map((service) => (
                            <Link
                              key={service}
                              href={`/servicos-de-saude/${slugify(service)}`}
                              onClick={() => {
                                setMobileNavSection(null);
                                setMobileNavOpen(false);
                              }}
                              className="block rounded-lg px-3 py-3 text-gray-700 hover:bg-gray-50"
                            >
                              {service}
                            </Link>
                          ))}
                    </nav>
                  </section>
                )}
              </aside>
            </div>
          )}

          {/* Campo de busca no meio */}
          <div
            className="hidden sm:block flex-1 max-w-xl mx-2 sm:mx-4"
            ref={searchRef}
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 3) {
                    setSearchOpen(true);
                  }
                }}
                placeholder="O que você procura hoje?"
                autoComplete="off"
                className="w-full pl-11 pr-10 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C10000] focus:bg-white focus:border-transparent transition duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Limpar pesquisa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              )}

              {searchOpen && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                  {searching ? (
                    <ProductSearchSkeleton dark={theme === "dark"} />
                  ) : searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">
                      Nenhum produto encontrado.
                    </p>
                  ) : (
                    <ul className="max-h-96 overflow-y-auto py-1">
                      {searchResults.map((product) => {
                        const image = product.images?.[0];
                        const badgeText = getProductBadge(product);
                        const installmentPrice =
                          product.installment_price ?? null;
                        const installments = product.installments ?? 3;

                        return (
                          <li key={product.id}>
                            <Link
                              href={`/produto/${product.slug}`}
                              onClick={() => setSearchOpen(false)}
                              className="mx-2 my-1 flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                              <span className="relative flex h-28 w-28 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                                {image ? (
                                  <img
                                    src={image}
                                    alt={product.name}
                                    loading="lazy"
                                    className="h-full w-full object-contain p-1"
                                  />
                                ) : (
                                  <Package
                                    className="h-5 w-5 text-gray-300"
                                    aria-hidden="true"
                                  />
                                )}
                                {badgeText && (
                                  <span
                                    className={getSearchBadgeClass(badgeText)}
                                  >
                                    {badgeText}
                                  </span>
                                )}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="line-clamp-2 text-sm font-normal text-gray-600">
                                  {product.name}
                                </span>
                                <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                                  <span className="text-sm font-bold text-gray-900">
                                    {currencyFormatter.format(product.price)}
                                  </span>
                                  {installmentPrice !== null &&
                                    installments > 1 && (
                                      <span className="text-[11px] text-gray-500">
                                        {installments}x de{" "}
                                        {currencyFormatter.format(
                                          installmentPrice,
                                        )}
                                      </span>
                                    )}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!searching && searchQuery.trim() && (
                    <Link
                      href={`/busca?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setSearchOpen(false)}
                      className="block border-t border-gray-100 px-4 py-3 text-sm font-medium text-[#A01717] transition-colors hover:bg-gray-50"
                    >
                      Ver todos os resultados para “{searchQuery.trim()}”
                    </Link>
                  )}
                </div>
              )}
            </form>
          </div>

          {mobileSearchOpen && (
            <div
              className="fixed inset-0 z-[110] bg-white sm:hidden"
              role="presentation"
            >
              <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search
                    className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 3) setSearchOpen(true);
                    }}
                    placeholder="O que você procura hoje?"
                    autoComplete="off"
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-10 text-sm text-gray-800 placeholder-gray-400 transition duration-200 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C10000]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Limpar pesquisa"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setSearchOpen(false);
                  }}
                  aria-label="Fechar pesquisa"
                  className="rounded-full p-2 text-gray-600 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-[calc(100dvh-4.25rem)] overflow-y-auto">
                {searchQuery.trim().length >= 3 &&
                  (searching ? (
                    <ProductSearchSkeleton mobile dark={theme === "dark"} />
                  ) : searchResults.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-gray-500">
                      Nenhum produto encontrado.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {searchResults.map((product) => {
                        const badgeText = getProductBadge(product);
                        return (
                          <li key={product.id}>
                            <Link
                              href={`/produto/${product.slug}`}
                              onClick={() => {
                                setMobileSearchOpen(false);
                                setSearchOpen(false);
                              }}
                              className="mx-3 my-2 flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 hover:border-gray-300 hover:bg-gray-50"
                            >
                              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                                {product.images?.[0] ? (
                                  <img
                                    src={product.images[0]}
                                    alt=""
                                    className="h-full w-full object-contain p-1"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-300" />
                                )}
                                {badgeText && (
                                  <span
                                    className={getSearchBadgeClass(
                                      badgeText,
                                      true,
                                    )}
                                  >
                                    {badgeText}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-normal text-gray-800">
                                  {product.name}
                                </span>
                                <span className="mt-1 block text-sm font-bold text-gray-900">
                                  {currencyFormatter.format(product.price)}
                                </span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ))}
                {searchQuery.trim() && !searching && (
                  <Link
                    href={`/busca?q=${encodeURIComponent(searchQuery.trim())}`}
                    onClick={() => {
                      setMobileSearchOpen(false);
                      setSearchOpen(false);
                    }}
                    className="block border-t border-gray-100 px-5 py-4 text-sm font-medium text-[#A01717]"
                  >
                    Ver todos os resultados para “{searchQuery.trim()}”
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Área à direita: Usuário e Sacola de compras */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Pesquisar produtos"
              className="sm:hidden rounded-full p-2 text-gray-700 hover:bg-gray-100"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Botão exclusivo para Admin: Criar */}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 sm:text-sm"
              >
                <Plus className="h-5 w-5 text-gray-400" />
                <span>Criar</span>
              </Link>
            )}

            {/* Usuário */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2.5 text-gray-700 hover:text-gray-900 transition-colors focus:outline-none group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-sm border border-gray-200">
                    {displayName ? (
                      displayName.charAt(0).toUpperCase()
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="hidden md:flex flex-col text-left max-w-[140px]">
                    <span className="text-xs text-gray-500 font-medium leading-none mb-1">
                      Bem vindo
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-gray-900 truncate leading-tight">
                        {displayName}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 shrink-0" />
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu do Usuário */}
                {dropdownOpen && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu da conta"
                    className="fixed inset-0 z-[100] h-dvh w-screen overflow-y-auto bg-white shadow-xl animate-in fade-in duration-100 sm:absolute sm:right-0 sm:top-full sm:inset-auto sm:z-50 sm:mt-2 sm:h-auto sm:w-64 sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-100 sm:shadow-xl sm:zoom-in-95"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:hidden">
                      <span className="text-base font-semibold text-gray-900">
                        Minha conta
                      </span>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(false)}
                        aria-label="Fechar menu da conta"
                        className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        <X size={24} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/70 px-4 py-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm">
                        {displayName ? (
                          displayName.charAt(0).toUpperCase()
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {user.name || user.email}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-2">
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                        >
                          <Shield className="h-5 w-5 text-gray-500" />
                          <span>Painel do Admin</span>
                          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Admin
                          </span>
                        </Link>
                      )}

                      <Link
                        href="/pedidos"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <PackageCheck className="h-5 w-5 text-gray-500" />
                        <span>Meus Pedidos</span>
                      </Link>

                      <Link
                        href="/lista"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <ListChecks className="h-5 w-5 text-gray-500" />
                        <span>Minha lista</span>
                      </Link>

                      <Link
                        href="/cupons"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <Tag className="h-5 w-5 text-gray-500" />
                        <span>Cupons de desconto</span>
                      </Link>

                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <LogOut className="h-5 w-5 text-gray-400 transition-colors group-hover:text-red-500" />
                        <span>Sair da conta</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Usuário Desconectado */
              <Link
                href="/login"
                className="flex items-center gap-2.5 group text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <UserIcon className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs text-gray-500 font-medium leading-none mb-1">
                    Bem vindo
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-gray-900 leading-tight">
                    Entre ou Cadastre-se
                  </span>
                </div>
              </Link>
            )}

            {/* Ícone de Bag à direita */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Abrir sacola de compras"
              aria-expanded={cartOpen}
              className="relative p-2.5 rounded-full text-black hover:text-[#C10000] transition-colors cursor-pointer"
            >
              <ShoppingCart size={28} />
              {cartItemCount > 0 && (
                <span
                  className={`absolute bottom-0 right-0 flex items-center justify-center min-w-5 h-5 px-1 text-xs font-bold rounded-full shadow-sm ${theme === "dark" ? "text-black bg-yellow-400" : "text-white bg-red-500"}`}
                >
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <CartSidebar open={cartOpen} onClose={closeCart} />
    </header>
  );

  return theme === "dark" ? applyHeaderTheme(content) : content;
}
