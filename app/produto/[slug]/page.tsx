import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "./ProductDetail";
import { getProductBySlug } from "@/lib/products-server";
import { absoluteUrl } from "@/lib/seo";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produto não encontrado", robots: { index: false, follow: false } };

  const description = product.description?.trim().replace(/\s+/g, " ").slice(0, 160);
  const image = product.images?.[0];

  return {
    title: product.name,
    description: description || `Confira preço, disponibilidade e detalhes de ${product.name} na Fanfar Farmácia.`,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: description || `Compre ${product.name} na Fanfar Farmácia.`,
      url: `/produto/${product.slug}`,
      ...(image ? { images: [image] } : {}),
    },
  };
}

function jsonLdScript(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const price = Number(product.promotional_price ?? product.price);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    image: product.images?.filter(Boolean),
    sku: product.specifications?.sku || undefined,
    gtin: product.specifications?.ean || undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/produto/${product.slug}`),
      priceCurrency: "BRL",
      price: Number.isFinite(price) ? price.toFixed(2) : undefined,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd) }}
      />
      <ProductDetail initialProduct={product} />
    </>
  );
}
