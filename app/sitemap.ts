import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { query } from "@/lib/db";
import { slugify } from "@/lib/catalog";
import { absoluteUrl } from "@/lib/seo";

type SitemapProduct = {
  slug: string;
  department: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  updated_at: string | Date | null;
};

function latestDate(current: Date | undefined, value: string | Date | null) {
  if (!value) return current;
  const date = new Date(value);
  return !current || date > current ? date : current;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache";
  cacheLife("hours");
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/ofertas"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/departamento"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/primeira-compra"), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const products = await query<SitemapProduct>(
      `SELECT slug, department, category, subcategory, brand, updated_at
       FROM public.products
       WHERE slug IS NOT NULL AND TRIM(slug) <> ''`,
    );

    const catalogs = new Map<string, Date | undefined>();
    const addCatalog = (path: string, updatedAt: string | Date | null) => {
      catalogs.set(path, latestDate(catalogs.get(path), updatedAt));
    };

    pages.push(
      ...products.map((product) => ({
        url: absoluteUrl(`/produto/${encodeURIComponent(product.slug)}`),
        lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );

    for (const product of products) {
      const department = product.department ? slugify(product.department) : "";
      const category = product.category ? slugify(product.category) : "";
      const subcategory = product.subcategory ? slugify(product.subcategory) : "";
      const brand = product.brand ? slugify(product.brand) : "";

      if (department) {
        addCatalog(`/departamento/${department}`, product.updated_at);
        if (category) {
          addCatalog(`/departamento/${department}/${category}`, product.updated_at);
          if (subcategory) {
            addCatalog(
              `/departamento/${department}/${category}/${subcategory}`,
              product.updated_at,
            );
          }
        }
      }

      if (brand) addCatalog(`/marca/${brand}`, product.updated_at);
    }

    pages.push(
      ...Array.from(catalogs, ([path, lastModified]) => ({
        url: absoluteUrl(path),
        lastModified,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    );
  } catch (error) {
    console.error("Não foi possível carregar produtos para o sitemap:", error);
  }

  return pages;
}
