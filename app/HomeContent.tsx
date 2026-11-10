"use client";

import { useEffect, useState } from "react";
import CategoryCarousel, {
  type StoreCategory,
} from "@/components/CategoryCarousel";
import BrandCarousel, { type StoreBrand } from "@/components/BrandCarousel";
import HomeBenefits from "@/components/HomeBenefits";
import ImageCarousel, { type CarouselImage } from "@/components/ImageCarousel";
import ProductCarousel from "@/components/ProductCarousel";
import WeeklyOffersCarousel from "@/components/WeeklyOffersCarousel";
import type { Product } from "@/types/product";
import SubHeader from "@/components/SubHeader";
import HomeBanner from "@/components/HomeBanner";

const HOME_BANNERS: CarouselImage[] = [
  {
    src: "/banners/Bertoletti Supermarket 52nd Anniversary Sale.png",
    mobileSrc: "/banners/Bertoletti 52 Anos_ Beer Savings-mobile.png",
    alt: "Supermercado Bertoletti 52 anos",
    href: "/ofertas",
  },
  {
    src: "/banners/Clube de Ofertas Super Bertoletti.png",
    mobileSrc: "/banners/Clube de Ofertas Super Bertoletti (1).png",
    alt: "Clube de Ofertas Super Bertoletti",
    href: "/ofertas",
  },
  {
    src: "/banners/Clube de Ofertas Super Bertoletti.png",
    mobileSrc: "/banners/Fanfar Green Sunscreen Sale Banner-mobile.png",
    alt: "Produtos de proteção solar ate 70% de desconto",
    href: "/ofertas",
  },
  {
    src: "/banners/Fanfar Infantil_ Ofertas em Verde.png",
    mobileSrc: "/banners/Fanfar Infantil_ Ofertas em Verde.png-mobile.png",
    alt: "Produtos infantil ate 50% off",
    href: "/ofertas",
  },
  {
    src: "/banners/Mantenha Seu Tratamento com Desconto.png",
    alt: "Mantenha Seu Tratamento com Desconto ate 75% off",
    mobileSrc: "/banners/Mantenha Seu Tratamento com Desconto-mobile.png",
    href: "/ofertas",
  },
  {
    src: "/banners/Green Bath & Wellness Sale.png",
    mobileSrc: "/banners/Green Bath & Wellness Sale-mobile.png",
    alt: "Green Bath & Wellness Sale",
    href: "/ofertas",
  },
];

const HOME_CATEGORIES: StoreCategory[] = [
  {
    name: "Aves, carnes e peixes",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/aves___954fa87140a46215bba5e23c430ed9b0.webp",
    href: "/departamento/aves-carnes-e-peixes",
  },
  {
    name: "Bebidas alcoólicas",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/alcoolicas___361c6215df0ce2ec013f2b9e2dcdb813.webp",
    href: "/departamento/bebidas-alcoolicas",
  },
  {
    name: "Bebidas não alcoólicas",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/nao-alcoolicas___e036add96c15cb5d8dd42d908d2437ea.webp",
    href: "/departamento/bebidas-nao-alcoolicas",
  },
  {
    name: "Higiene e beleza",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/higiene-beleza___9f3e07cc697bb7c4b761616671c7c847.webp",
    href: "/departamento/higiene-e-beleza",
  },
  {
    name: "Hortifrúti",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/hortifruti___1e4186e03006550aac916d452624b4de.webp",
    href: "/departamento/hortifruti",
  },
  {
    name: "Mercearia",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/mercearia___b5279a2733ea43d6add2deb6306db222.webp",
    href: "/departamento/mercearia",
  },
  {
    name: "Padaria e rotisseria",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/padaria___6015c6e5f6f6b1a0983f9da359399ec2.webp",
    href: "/departamento/padaria-e-rotisseria",
  },
  {
    name: "Cestas, kits e presentes",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/kits___0f5529cda703a6aff85773d2024453af.webp",
    href: "/departamento/cestas-kits-e-presentes",
  },
  {
    name: "Congelados e resfriados",
    image:
      "https://devb8supernosso.vtexassets.com/assets/vtex/assets-builder/devb8supernosso.store-theme/4.0.82/imgs/category-images/congelados___6ad31d263f004a6eea2901f942e8c34d.webp",
    href: "/departamento/congelados-e-resfriados",
  },
];

const HOME_BRANDS: StoreBrand[] = [
  {
    name: "Nivea",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20251201080000_67fceff7d9a18f57f8389093_1/mjirbhybxo9bn7.webp",
    href: "/marca/nivea",
  },
  {
    name: "Pampers",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20251223131500_67fceff7d9a18f57f8389093_5/mjisiegtqwmls5.webp",
    href: "/marca/pampers",
  },
  {
    name: "Dove",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20251201080000_67fceff7d9a18f57f8389093_2/mjirbhyb13je7z.webp",
    href: "/marca/dove",
  },
  {
    name: "Principia",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20260529173600_6a19f68092169b007cec4b7b_0/mprdi82ehrzuhp.webp",
    href: "/marca/principia",
  },
  {
    name: "Rexona",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20251201080000_67fceff7d9a18f57f8389093_8/mjirbhybk9q4zq.webp",
    href: "/marca/rexona",
  },
  {
    name: "Huggies",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/brand/all/20251201080000_67fceff7d9a18f57f8389093_7/mjirbhyb464eo0.webp",
    href: "/marca/huggies",
  },
  {
    name: "Eucerin",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/category/promotional_1/all/20260430110000_69f35c970e4a40435f3153fc_10/molp7khnioyr2f.webp",
    href: "/marca/eucerin",
  },
  {
    name: "Condres",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/promotional_7/all/20260703150000_6a4805c615d04446474d3802_0/mr5ao733nrg1xz.webp",
    href: "/marca/condres",
  },
  {
    name: "Danone",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/promotional_9/all/20261022135000_6ada3780d126397280483eef_0/mvjqz4fb7s3kef.webp",
    href: "/marca/danone",
  },
  {
    name: "Lux",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/promotional_9/all/20260826153500_6a4805c615d04446474d3802_0/mtafhwlzf81ag1.webp",
    href: "/marca/lux",
  },
  {
    name: "Elmex",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/promotional_9/all/20260826153500_6a4805c615d04446474d3802_0/mtafiqvp4pjsat.webp",
    href: "/marca/elmex",
  },
  {
    name: "Johnson's",
    image:
      "https://cdn1.staticpanvel.com.br/cdn_service/banners/home/promotional_9/all/20260930105000_6abd0c4f193ad5761019f7dd_0/muo4zggqc4w0qd.webp",
    href: "/marca/johnson-s",
  },
  {
    name: "Libbs",
    image:
      "https://sjdigital.vtexassets.com/assets/vtex.file-manager-graphql/images/88f148ff-2443-4add-aad9-e9e09593c9b8___dac57c0c26da8531ea733026595d6181.webp",
    href: "/marca/libbs",
  },
  {
    name: "EMS",
    image:
      "https://sjdigital.vtexassets.com/assets/vtex.file-manager-graphql/images/468535dd-4064-44f8-9a35-2ec81b8d6a04___2aa05ff9a1fd9ce351147eaa2925f838.webp",
    href: "/marca/ems",
  },
];

const CARE_DEPARTMENTS = [
  "Dermocosméticos",
  "Higiene e Cuidados Pessoais",
  "Beleza e Perfumaria",
];

interface HomeProductSection {
  key: string;
  title: string;
  subtitle: string;
  products: Product[];
}

function discountPercentage(product: Product): number {
  const price = Number(product.price);
  const promotionalPrice =
    product.promotional_price == null
      ? null
      : Number(product.promotional_price);

  if (promotionalPrice !== null && promotionalPrice < price && price > 0) {
    return 1 - promotionalPrice / price;
  }

  const originalPrice =
    product.original_price == null ? null : Number(product.original_price);

  if (originalPrice === null || originalPrice <= price) {
    return 0;
  }

  return 1 - price / originalPrice;
}

export default function HomeContent({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (active && response.ok) {
          setProducts(data.products ?? []);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const featured = products.filter((product) => product.is_featured);
  const remaining = products.filter((product) => !product.is_featured);
  const mostBought = [...featured, ...remaining];

  const discounted = [...products]
    .filter((product) => discountPercentage(product) > 0)
    .sort((a, b) => discountPercentage(b) - discountPercentage(a));
  const blackDeals =
    discounted.length > 0
      ? discounted
      : [...products].sort((a, b) => b.price - a.price);

  const mostViewed = [...products].reverse();
  const montaQueDesconta = [...products].sort((a, b) => a.price - b.price);

  const careProducts = products.filter((product) =>
    CARE_DEPARTMENTS.includes(product.department ?? ""),
  );
  const cares = careProducts.length > 0 ? careProducts : products;
  const newArrivals = products.filter((product) => product.is_new);

  const productSections: HomeProductSection[] = [
    {
      key: "novidades",
      title: "Acabou de chegar",
      subtitle: "Conheça as novidades que chegaram na Fanfar.",
      products: newArrivals,
    },
    {
      key: "mais-comprados",
      title: "Mais comprados",
      subtitle: "Os queridinhos de quem compra no Bertoletti.",
      products: mostBought,
    },
    {
      key: "black-do-dia",
      title: "Ofertas da semana",
      subtitle: "Confira as ofertas especiais da semana.",
      products: blackDeals,
    },
    {
      key: "mais-vistos",
      title: "Mais Vistos",
      subtitle: "Os produtos que todo mundo está de olho.",
      products: mostViewed,
    },
    {
      key: "monta-que-desconta",
      title: "Monta que desconta",
      subtitle: "Combine produtos na sua compra e ganhe mais descontos.",
      products: montaQueDesconta,
    },
    {
      key: "cuidados",
      title: "Cuidados que você merece",
      subtitle: "Dermocosméticos, higiene e beleza para a sua rotina.",
      products: cares,
    },
  ];

  return (
    <main className="flex-1 bg-white">
      <SubHeader />
      <HomeBanner />
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <ImageCarousel images={HOME_BANNERS} />
        </div>
      </section>

      <HomeBenefits />

      <CategoryCarousel
        categories={HOME_CATEGORIES}
        title="Ofertas por departamento"
      />

      {loading ? (
        productSections.map((section) =>
          section.key === "black-do-dia" ? (
            <WeeklyOffersCarousel key={section.key} products={[]} loading />
          ) : (
            <section key={section.key} aria-hidden="true" className="py-8">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-2 h-7 w-56 animate-pulse rounded bg-gray-200" />
                <div className="mb-5 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
                <div className="flex gap-3 overflow-hidden">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="h-80 w-[190px] shrink-0 animate-pulse rounded-2xl bg-gray-100 sm:w-[230px] lg:w-[250px]"
                    />
                  ))}
                </div>
              </div>
            </section>
          ),
        )
      ) : products.length > 0 ? (
        productSections.map((section) =>
          section.key === "black-do-dia" ? (
            <WeeklyOffersCarousel
              key={section.key}
              products={blackDeals.slice(0, 12)}
            />
          ) : (
            <ProductCarousel
              key={section.key}
              products={section.products}
              title={section.title}
              subtitle={section.subtitle}
            />
          ),
        )
      ) : (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm text-gray-500">
              Nenhum produto disponível no momento.
            </p>
          </div>
        </section>
      )}

      <BrandCarousel brands={HOME_BRANDS} />
    </main>
  );
}
