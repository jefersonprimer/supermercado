import type { ProductSpecifications } from "@/types/product";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function getUnitPriceLabel(
  specifications: ProductSpecifications | undefined,
  price: number,
): string | null {
  const amount = Number(specifications?.quantidade_conteudo);
  const unit = specifications?.unidade_conteudo;
  const normalizedPrice = Number(price);

  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    return null;
  }

  if (unit === "unidade") {
    const perUnit = normalizedPrice / amount;
    return `(${currencyFormatter.format(perUnit)} cada unidade)`;
  }

  if (unit === "g" || unit === "kg") {
    const kilograms = unit === "g" ? amount / 1000 : amount;
    return `(${currencyFormatter.format(normalizedPrice / kilograms)} cada quilo)`;
  }

  if (unit === "ml" || unit === "l") {
    const liters = unit === "ml" ? amount / 1000 : amount;
    return `(${currencyFormatter.format(normalizedPrice / liters)} cada litro)`;
  }

  return null;
}
