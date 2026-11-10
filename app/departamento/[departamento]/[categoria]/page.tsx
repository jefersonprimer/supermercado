import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { readableCatalogName } from "@/lib/catalog-seo";
import { getAllProducts } from "@/lib/products-server";

type Props = { params: Promise<{ departamento: string; categoria: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { departamento, categoria } = await params;
  const departmentName = readableCatalogName(departamento);
  const categoryName = readableCatalogName(categoria);
  return {
    title: `${categoryName} em ${departmentName}`,
    description: `Encontre ${categoryName} em ${departmentName}: veja produtos, preços e ofertas na Fanfar Farmácia.`,
    alternates: { canonical: `/departamento/${departamento}/${categoria}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { departamento, categoria } = await params;
  return <CatalogView departmentSlug={departamento} categorySlug={categoria} initialProducts={await getAllProducts()} />;
}
