"use client";

import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  Menu,
  ChevronDown,
  ChevronRight,
  X,
  Navigation,
} from "lucide-react";
import { slugify } from "@/lib/catalog";
import type { Product } from "@/types/product";

interface SubHeaderProps {
  theme?: "light" | "dark";
}

const darkClassReplacements: Record<string, string> = {
  "bg-white": "bg-zinc-900",
  "bg-gray-50": "bg-white/5",
  "bg-gray-50/60": "bg-white/5",
  "bg-gray-100": "bg-white/10",
  "bg-gray-200": "bg-white/15",
  "border-gray-100": "border-white/10",
  "border-gray-200": "border-white/10",
  "border-gray-300": "border-white/15",
  "text-gray-900": "text-white",
  "text-gray-800": "text-white/80",
  "text-gray-700": "text-white/70",
  "text-gray-600": "text-white/60",
  "text-gray-500": "text-white/50",
  "text-gray-400": "text-white/40",
  "text-gray-300": "text-white/30",
  "text-[#279236]": "text-[#C10000]",
  "bg-[#279236]/10": "bg-[#A01717]/15",
  "bg-[#279236]": "bg-[#A01717]",
  "hover:bg-[#1f7a2b]": "hover:bg-[#C10000]",
  "hover:bg-[#279236]/5": "hover:bg-[#A01717]/10",
  "hover:border-[#279236]/40": "hover:border-[#C10000]/40",
  "focus:ring-[#279236]": "focus:ring-[#C10000]/50",
  "hover:bg-gray-50": "hover:bg-white/10",
  "hover:bg-gray-100": "hover:bg-white/10",
  "hover:text-gray-900": "hover:text-white/90",
  "hover:text-gray-600": "hover:text-white/70",
  "hover:text-[#279236]": "hover:text-[#C10000]",
};

function applySubHeaderTheme(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
      const className = child.props.className?.replace(
        /\S+/g,
        (token) => darkClassReplacements[token] ?? token,
      );

      return cloneElement(child, {
        ...(className ? { className } : {}),
        children: applySubHeaderTheme(child.props.children),
      });
    }

    return child;
  });
}

function createThemedPortal(children: ReactNode, theme: SubHeaderProps["theme"]) {
  const content = theme === "dark" ? applySubHeaderTheme(children) : children;
  return createPortal(content, document.body);
}

interface CatalogCategory {
  name: string;
  subcategories: string[];
}

interface CatalogDepartment {
  name: string;
  categories: CatalogCategory[];
}

function buildCatalog(products: Product[]): CatalogDepartment[] {
  const departments = new Map<string, Map<string, Set<string>>>();

  for (const product of products) {
    const departmentName = product.department?.trim();
    if (!departmentName) continue;

    let categories = departments.get(departmentName);
    if (!categories) {
      categories = new Map();
      departments.set(departmentName, categories);
    }

    const categoryName = product.category?.trim();
    if (!categoryName) continue;

    let subcategories = categories.get(categoryName);
    if (!subcategories) {
      subcategories = new Set();
      categories.set(categoryName, subcategories);
    }

    const subcategoryName = product.subcategory?.trim();
    if (subcategoryName) subcategories.add(subcategoryName);
  }

  return Array.from(departments, ([name, categories]) => ({
    name,
    categories: Array.from(categories, ([categoryName, subcategories]) => ({
      name: categoryName,
      subcategories: Array.from(subcategories),
    })),
  }));
}

export default function SubHeader({ theme = "light" }: SubHeaderProps) {
  const [cepModalOpen, setCepModalOpen] = useState(false);
  const [cepInput, setCepInput] = useState("");
  const [currentCep, setCurrentCep] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [catalogDepartments, setCatalogDepartments] = useState<CatalogDepartment[]>([]);
  const [activeDepartment, setActiveDepartment] = useState("");

  const cepDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active || !data?.products) return;
        const departments = buildCatalog(data.products);
        setCatalogDepartments(departments);
        setActiveDepartment((current) => current || departments[0]?.name || "");
      })
      .catch((error) => console.error("Erro ao carregar departamentos:", error));

    return () => {
      active = false;
    };
  }, []);

  // Carrega CEP salvo do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fanfar_cep");
      if (saved) {
        setCurrentCep(saved);
        setCepInput(saved);
      }
    } catch {
      // Ignora erro de acesso a storage
    }
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cepDropdownRef.current &&
        !cepDropdownRef.current.contains(event.target as Node)
      ) {
        setCepModalOpen(false);
      }
    }

    if (cepModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cepModalOpen]);

  // Fecha com a tecla Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCepModalOpen(false);
      }
    }

    if (cepModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cepModalOpen]);

  // Fecha o modal de departamentos com a tecla Escape e trava o scroll
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDepartmentModalOpen(false);
      }
    }

    if (departmentModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [departmentModalOpen]);

  // Formata o CEP para o formato 00000-000
  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    return digits;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCepInput(formatted);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const handleSaveCep = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cepInput.replace(/\D/g, "");
    if (clean.length === 8) {
      const formatted = formatCep(clean);
      setCurrentCep(formatted);
      try {
        localStorage.setItem("fanfar_cep", formatted);
      } catch {}
      setCepModalOpen(false);
      setErrorMessage(null);
    } else {
      setErrorMessage("Por favor, digite um CEP válido com 8 dígitos.");
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          if (res.ok) {
            const data = await res.json();
            const postcode = data.address?.postcode;
            if (postcode) {
              const formatted = formatCep(postcode);
              setCepInput(formatted);
              setCurrentCep(formatted);
              try {
                localStorage.setItem("fanfar_cep", formatted);
              } catch {}
              setCepModalOpen(false);
              return;
            }
          }
          setErrorMessage(
            "Não foi possível identificar o CEP exato pela localização. Digite manualmente.",
          );
        } catch {
          setErrorMessage("Não foi possível obter o CEP pela sua localização.");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setErrorMessage("Permissão de localização negada pelo navegador.");
        } else {
          setErrorMessage("Erro ao obter localização atual.");
        }
      },
      { timeout: 10000 },
    );
  };

  const activeCategories =
    catalogDepartments.find((department) => department.name === activeDepartment)?.categories ?? [];

  const content = (
    <nav className={`w-full border-b text-sm relative z-40 ${theme === "dark" ? "bg-zinc-900 border-white/10" : "bg-white border-gray-200"}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[52px] min-w-0 items-center justify-between gap-3 py-2 sm:gap-6">
          {/* Esquerda: Insira seu CEP com Dropdown logo abaixo */}
          <div className="relative shrink-0" ref={cepDropdownRef}>
            <button
              type="button"
              onClick={() => setCepModalOpen((prev) => !prev)}
              aria-expanded={cepModalOpen}
              className={theme === "dark"
                ? "flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 text-xs text-white/60 transition-colors hover:border-white/15 hover:bg-white/8 hover:text-white/90 sm:text-sm"
                : "flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors py-1.5 px-2.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-200"}
            >
              <MapPin className="h-4 w-4 text-[#A01717] shrink-0" />
              <span className="font-medium whitespace-nowrap">
                {currentCep ? `CEP: ${currentCep}` : "Insira o seu CEP"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                  cepModalOpen ? "rotate-180 text-gray-600" : ""
                }`}
              />
            </button>

            {/* Modal / Popover logo abaixo de onde foi chamado */}
            {cepModalOpen && (
              <div
                role="dialog"
                aria-label="Informe seu Cep"
                className={theme === "dark"
                  ? "absolute left-0 top-full z-50 mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-white/15 bg-zinc-900 p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 sm:w-96"
                  : "absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150"}
              >
                {/* Seta discreta apontando para o botão */}
                <div className={theme === "dark" ? "absolute -top-1.5 left-7 h-3 w-3 rotate-45 border-l border-t border-white/15 bg-zinc-900" : "absolute -top-1.5 left-7 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"} />

                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-base font-bold leading-snug ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Informe seu {theme === "dark" ? "CEP" : "Cep"}
                    </h3>
                    <p className={`mt-1 text-xs leading-relaxed ${theme === "dark" ? "text-white/40" : "text-gray-500"}`}>
                      {theme === "dark"
                        ? "Estoque e tempo de entrega podem variar por região."
                        : "Estoque e tempo de entrega podem variar de acordo com a região."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCepModalOpen(false)}
                    className={theme === "dark" ? "-mr-1 -mt-1 rounded-full p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70" : "p-1 -mr-1 -mt-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"}
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Corpo: Adicione seu CEP */}
                <div className="mt-4">
                  <label
                    htmlFor="cep-input"
                    className={`mb-1.5 block text-xs font-semibold ${theme === "dark" ? "text-white/70" : "text-gray-800"}`}
                  >
                    Adicione seu CEP
                  </label>

                  <form onSubmit={handleSaveCep} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={theme === "dark" ? "flex-1" : "relative flex-1"}>
                        <input
                          id={theme === "dark" ? "bw-cep-input" : "cep-input"}
                          type="text"
                          inputMode="numeric"
                          maxLength={9}
                          value={cepInput}
                          onChange={handleCepChange}
                          placeholder={theme === "dark" ? "00000-000" : "CEP"}
                          className={theme === "dark"
                            ? "w-full rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-white/25 transition focus:border-yellow-400/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
                            : "w-full px-3.5 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C10000] focus:border-transparent transition-all"}
                          autoFocus
                        />
                        {cepInput && theme === "light" && (
                          <button
                            type="button"
                            onClick={() => setCepInput("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
                            aria-label="Limpar campo"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={cepInput.replace(/\D/g, "").length !== 8}
                        className={theme === "dark"
                          ? "shrink-0 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                        : "px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#A01717] hover:bg-[#C10000] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors shrink-0 shadow-sm"}
                      >
                        {theme === "dark" ? "OK" : "Inserir"}
                      </button>
                    </div>

                    {errorMessage && (
                      <p className={`font-medium ${theme === "dark" ? "text-xs text-red-400" : "text-[11px] text-red-600"}`}>
                        {errorMessage}
                      </p>
                    )}

                    {/* Botão Usar minha localização */}
                    <button
                      type="button"
                      onClick={handleUseLocation}
                      disabled={isLocating}
                      className={theme === "dark"
                        ? "flex items-center gap-2 text-xs font-medium text-yellow-400 transition-colors hover:text-yellow-300 disabled:opacity-50"
                        : "w-full flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 hover:border-[#C10000]/40 bg-gray-50/60 hover:bg-[#A01717]/5 rounded-full text-xs sm:text-sm font-medium text-[#A01717] transition-colors disabled:opacity-60 disabled:cursor-not-allowed group"}
                    >
                      <Navigation
                        className={`shrink-0 transition-transform ${theme === "dark" ? "h-3.5 w-3.5" : "h-4 w-4 group-hover:scale-110"} ${theme === "dark" ? "text-[#C10000]" : "text-[#A01717]"} ${isLocating ? "animate-spin" : ""}`}
                      />
                      <span>
                        {isLocating
                          ? "Buscando sua localização..."
                          : theme === "dark"
                            ? "Usar minha localização atual"
                            : "Usar minha localização"}
                      </span>
                    </button>
                  </form>

                  {/* Rodapé informativo */}
                  {theme === "light" && <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-[11px] text-gray-400 text-center leading-normal">
                      Confirme o endereço na finalização da compra.
                    </p>
                  </div>}
                </div>
              </div>
            )}
          </div>

          {/* Separador vertical */}
          <div className={`hidden h-4 w-px shrink-0 sm:block ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`} />

          {/* Meio: Departamentos e Links de Navegação (sem ícones exceto Menu de hambúrguer) */}
          <div className={`hidden sm:flex min-w-0 flex-1 overflow-x-auto ${theme === "dark" ? "items-center gap-2 scrollbar-hide justify-center py-1 sm:justify-start text-sm font-medium" : "items-center gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 text-xs sm:text-sm font-medium text-gray-700"}`}>
            {/* Botão Departamentos - somente o ícone de hambúrguer */}
            <button
              type="button"
              onClick={() => setDepartmentModalOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={departmentModalOpen}
              className={theme === "dark"
                ? "flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-4 py-2 font-semibold text-white/70 transition-colors hover:border-white/15 hover:bg-white/8 hover:text-white/90"
                : "flex items-center gap-1.5 py-2 px-4 rounded-full hover:text-[#C10000] hover:bg-neutral-100 transition-colors font-semibold text-gray-900 shrink-0"}
            >
              <Menu className={`h-4 w-4 shrink-0 ${theme === "dark" ? "text-white/60" : "text-gray-700"}`} />
              <span>Departamentos</span>
            </button>

            <Link
              href="/ofertas"
              className={theme === "dark"
                ? "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
                : "hover:text-[#C10000] hover:bg-neutral-100 rounded-full transition-colors whitespace-nowrap py-2 px-3 shrink-0"}
            >
              Ofertas
            </Link>

            <Link
              href="/cupons"
              className={theme === "dark"
                ? "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
                : "hover:text-[#C10000] hover:bg-neutral-100 rounded-full transition-colors whitespace-nowrap py-2 px-3 shrink-0"}
            >
              Cupons
            </Link>

            <Link
              href="/black-week"
              className={theme === "dark"
                ? "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
                : "shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors hover:bg-neutral-100 hover:text-[#C10000]"}
            >
              Black Week
            </Link>

            <Link
              href="/primeira-compra"
              className={theme === "dark"
                ? "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
                : "shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors hover:bg-neutral-100 hover:text-[#C10000]"}
            >
              Primeira Compra? Ganhe CUPOM!
            </Link>

            {catalogDepartments.slice(0, 5).map((department) => (
              <Link
                key={department.name}
                href={`/departamento/${slugify(department.name)}`}
                className={theme === "dark"
                  ? "shrink-0 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white/90"
                  : "shrink-0 whitespace-nowrap rounded-full px-3 py-2 transition-colors hover:bg-neutral-100 hover:text-[#C10000]"}
              >
                {department.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Departamentos com categorias ao passar o cursor */}
      {departmentModalOpen &&
        createThemedPortal(
          <div
            className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-32 sm:pt-36"
            role="presentation"
            onMouseDown={() => setDepartmentModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Departamentos"
              onMouseDown={(event) => event.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] max-h-[70vh]">
                {/* Departamentos */}
                <ul className="border-b sm:border-b-0 sm:border-r border-gray-100 p-2 sm:p-3 overflow-y-auto max-h-48 sm:max-h-none [scrollbar-width:thin]">
                  {catalogDepartments.map((department) => {
                    const isActive = department.name === activeDepartment;
                    return (
                      <li key={department.name}>
                        <Link
                          href={`/departamento/${slugify(department.name)}`}
                          onMouseEnter={() =>
                            setActiveDepartment(department.name)
                          }
                          onFocus={() => setActiveDepartment(department.name)}
                          onClick={() => setDepartmentModalOpen(false)}
                          aria-current={isActive ? "true" : undefined}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-[#A01717]/10 text-[#A01717]"
                              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <span className="truncate">{department.name}</span>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 transition-transform ${
                              isActive
                                ? "text-[#A01717] translate-x-0.5"
                                : "text-gray-300"
                            }`}
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {/* Categorias do departamento ativo */}
                <div className="p-4 sm:p-5 overflow-y-auto max-h-[50vh] sm:max-h-[calc(70vh-73px)]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeCategories.map((category) => (
                      <div key={category.name}>
                        <Link
                          href={`/departamento/${slugify(activeDepartment)}/${slugify(category.name)}`}
                          onClick={() => setDepartmentModalOpen(false)}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <span>{category.name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                        </Link>
                        {category.subcategories.length > 0 && (
                          <ul className="mb-1 ml-3 border-l border-gray-100 pl-2">
                            {category.subcategories.map((subcategory) => (
                              <li key={subcategory}>
                                <Link
                                  href={`/departamento/${slugify(activeDepartment)}/${slugify(category.name)}/${slugify(subcategory)}`}
                                  onClick={() => setDepartmentModalOpen(false)}
                                  className="block rounded-md px-2 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                                >
                                  {subcategory}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          theme,
        )}
    </nav>
  );

  return theme === "dark" ? applySubHeaderTheme(content) : content;
}
