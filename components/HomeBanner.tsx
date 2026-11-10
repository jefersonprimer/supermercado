import Image from "next/image";
import Link from "next/link";

const BANNER_IMAGE =
  "https://carrefour-latam.flavedo.io/citrus/3e6affc7-6513-4687-9789-064c1b63080a";

export default function HomeBanner() {
  return (
    <section aria-label="Destaque do Supermercado Bertoletti" className="my-4 w-full bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/marca/garoto"
          aria-label="Ver produtos da marca Garoto"
          className="block overflow-hidden rounded-2xl"
        >
          <Image
            src={BANNER_IMAGE}
            alt="Destaque do Supermercado Bertoletti"
            width={1920}
            height={480}
            sizes="(min-width: 1280px) 1216px, 100vw"
            priority
            unoptimized
            className="block h-auto w-full"
          />
        </Link>
      </div>
    </section>
  );
}
