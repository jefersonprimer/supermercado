import type { Metadata } from "next";
import CatalogView from "@/components/CatalogView";
import { readableCatalogName } from "@/lib/catalog-seo";
import { getAllProducts } from "@/lib/products-server";

type Props = {
  params: Promise<{ departamento: string; categoria: string; subcategoria: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { departamento, categoria, subcategoria } = await params;
  const name = readableCatalogName(subcategoria);
  const parent = readableCatalogName(categoria);
  return {
    title: `${name} em ${parent}`,
    description: `Veja produtos e ofertas de ${name} em ${parent} na Fanfar Farmácia.`,
    alternates: {
      canonical: `/departamento/${departamento}/${categoria}/${subcategoria}`,
    },
  };
}

export default async function SubcategoryPage({ params }: Props) {
  const { departamento, categoria, subcategoria } = await params;
  return (
    <CatalogView
      initialProducts={await getAllProducts()}
      departmentSlug={departamento}
      categorySlug={categoria}
      subcategorySlug={subcategoria}
    />
  );
}
