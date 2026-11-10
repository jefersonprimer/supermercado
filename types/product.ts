import type { AppliedPromotion } from "@/types/promotion";

export interface ProductSpecifications {
  ean?: string;
  sku?: string;
  categoria_produtos?: string;
  genero?: string;
  tipo_produto?: string;
  tipo_embalagem?: string;
  fabricante?: string;
  composicao?: string;
  indicacoes_uso?: string;
  linha?: string;
  modo_uso?: string;
  quantidade_conteudo?: number;
  unidade_conteudo?: "unidade" | "g" | "kg" | "ml" | "l";
}

export interface ProductVariation {
  id?: string;
  nome: string; // Ex: "500mg - 20 comprimidos" ou "Frasco 200ml"
  preco?: number;
  estoque?: number;
  sku?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  department?: string; // Departamento
  category?: string; // Categoria
  subcategory?: string; // Subcategoria
  brand?: string; // Marca
  images: string[]; // Array de URLs de imagens
  options: ProductVariation[]; // Variações / Opções
  description: string;
  specifications: ProductSpecifications; // Especificações técnicas
  price: number; // Preço à vista
  original_price?: number | null; // Preço original / De
  installment_price?: number | null; // Preço a prazo
  installments?: number; // Quantas vezes parcelado (ex: 3x, 6x, 10x)
  stock: number;
  is_featured: boolean;
  is_new?: boolean;
  promotion?: AppliedPromotion | null;
  promotional_price?: number | null;
  promotional_badge?: string | null;
  promotional_discount_percent?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  department?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  images: string[];
  options?: ProductVariation[];
  description?: string;
  specifications?: ProductSpecifications;
  price: number;
  original_price?: number | null;
  installment_price?: number | null;
  installments?: number;
  stock?: number;
  is_featured?: boolean;
  is_new?: boolean;
}
