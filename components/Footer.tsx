import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { InstagramIcon } from "@/components/InstagramIcon";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Children, cloneElement, isValidElement, type ReactNode } from "react";

const storeInfo = {
  name: "Supermercado Bertoletti",
  city: "Frederico Westphalen",
  state: "RS",
  address: "Av. João Muñiz Reis, 1218",
  phone: "(55) 3744-1545",
  phoneNumber: "555537441545",
  whatsappDisplay: "(55) 98424-1546",
  whatsappNumber: "5555984241546",
  instagramUrl: "https://www.instagram.com/superbertoletti",
  businessHoursWeekday: "Segunda a sexta: 08h às 12h e 13h30 às 19h30",
  businessHoursWeekend: "Sábado: 08h às 19h30 · Domingo: fechado",
};

const navLinks = [
  { label: "Mercearia", href: "/departamento/mercearia" },
  { label: "Hortifruti", href: "/departamento/hortifruti" },
  { label: "Açougue", href: "/departamento/acougue" },
  { label: "Ofertas da Semana", href: "/ofertas", highlight: true },
  { label: "Todos os departamentos", href: "/departamento" },
  { label: "Trabalhe conosco", href: "/trabalhe-conosco" },
  { label: "SAC — Sugestões e reclamações", href: "/sac" },
];

const paymentMethods = [
  { name: "Visa", src: "/payments/visa.svg" },
  { name: "MasterCard", src: "/payments/mastercard.svg" },
  { name: "Amex", src: "/payments/amex.svg" },
  { name: "Diners", src: "/payments/diners.svg" },
  { name: "Elo", src: "/payments/elo.svg" },
  { name: "JCB", src: "/payments/jcb.svg" },
  { name: "Nupay", src: "/payments/nupay.svg" },
  { name: "Pix", src: "/payments/pix.svg" },
];

interface FooterProps {
  theme?: "light" | "dark";
}

const darkClassReplacements: Record<string, string> = {
  "bg-white": "bg-black",
  "bg-gray-100": "bg-white/8",
  "bg-gray-200": "bg-white/15",
  "bg-neutral-100": "bg-black/40",
  "border-gray-200": "border-white/10",
  "border-gray-100": "border-white/10",
  "border-neutral-200": "border-white/8",
  "text-slate-600": "text-white/60",
  "text-slate-500": "text-white/40",
  "text-gray-900": "text-white/90",
  "text-gray-800": "text-white/80",
  "text-gray-600": "text-white/50",
  "text-gray-500": "text-white/25",
  "text-gray-400": "text-white/30",
  "text-neutral-600": "text-white/25",
  "text-neutral-800": "text-white/30",
  "text-neutral-900": "text-white/40",
  "from-[#A01717]": "from-[#6f1010]",
  "to-[#C10000]": "to-[#8f1111]",
  "hover:bg-gray-200": "hover:bg-white/15",
  "hover:text-gray-900": "hover:text-white/90",
};

function applyFooterTheme(node: ReactNode): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement<{ className?: string; children?: ReactNode }>(child))
      return child;

    const className = child.props.className?.replace(
      /\S+/g,
      (token) => darkClassReplacements[token] ?? token,
    );

    return cloneElement(child, {
      ...(className ? { className } : {}),
      children: applyFooterTheme(child.props.children),
    });
  });
}

export default function Footer({ theme = "light" }: FooterProps) {
  const footerNavLinks = navLinks;

  const content = (
    <footer className="border-t border-gray-200 bg-white text-slate-600">
      <section className="pb-8 pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-col gap-5 rounded-2xl px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}>
            <div className="flex items-start gap-4 sm:items-center">
              <div
                className={
                  theme === "dark"
                    ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white"
                    : "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white"
                }
              >
                <WhatsAppIcon className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Tire suas dúvidas por WhatsApp
                </h2>
                <p
                  className={
                    theme === "dark"
                      ? "mt-1 text-sm text-white/60"
                      : "mt-1 text-sm text-gray-600"
                  }
                >
                  Fale com a nossa equipe e consulte os produtos e ofertas.
                </p>
                <p
                  className={
                    theme === "dark"
                      ? "text-xs text-white/40"
                      : "text-xs text-gray-500"
                  }
                >
                  Atendimento pelo número oficial do supermercado.
                </p>
              </div>
            </div>

            <a
              href={`https://wa.me/${storeInfo.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className={
                theme === "dark"
                  ? "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#20BD5A]"
                  : "inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#20BD5A]"
              }
            >
              <WhatsAppIcon className="h-4 w-4" />
              Acessar WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
            {/* Brand Info & Mission */}
            <div className="lg:col-span-2 space-y-4">
              <Link
                href="/"
                className={`inline-flex items-center ${theme === "dark" ? "gap-3" : "gap-2.5"}`}
              >
                <Image
                  src={
                    theme === "dark"
                      ? "/logo-name.png"
                      : "/logo-name.png"
                  }
                  alt="Supermercado Bertoletti"
                  width={theme === "dark" ? 220 : 160}
                  height={theme === "dark" ? 78 : 50}
                  className={
                    theme === "dark"
                      ? "h-12 sm:h-14 w-auto object-contain"
                      : "h-10 sm:h-12 w-auto object-contain"
                  }
                />
              </Link>

              <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
                Há mais de 50 anos fazendo parte da vida de Frederico Westphalen,
                com variedade, qualidade e atendimento próximo para a sua família.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <a
                  href={storeInfo.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-[#E4405F]"
                  title="Instagram do Supermercado Bertoletti"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-6 h-6" />
                </a>

                <a
                  href="https://www.facebook.com/superbertoletti/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-[#0866FF]"
                  title="Facebook Super Bertoletti"
                  aria-label="Facebook"
                >
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                  </svg>
                </a>

                <a
                  href="https://www.tiktok.com/@superbertoletti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-[#FE2C55]"
                  title="TikTok Super Bertoletti"
                  aria-label="TikTok"
                >
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>

                <a
                  href="https://www.linkedin.com/company/super-bertoletti"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-[#0A66C2]"
                  title="LinkedIn Super Bertoletti"
                  aria-label="LinkedIn"
                >
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                <a
                  href={`https://wa.me/${storeInfo.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    theme === "dark"
                      ? "flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 hover:text-[#25D366]"
                      : "w-9 h-9 rounded-full flex items-center justify-center text-gray-500 transition-colors hover:text-[#25D366]"
                  }
                  title="WhatsApp Oficial"
                  aria-label="WhatsApp"
                >
                  <WhatsAppIcon className="w-6 h-6" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-white/30" : "text-gray-900"}`}
              >
                Navegação
              </h4>
              <ul className="space-y-2 text-xs">
                {footerNavLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`transition-colors hover:underline underline-offset-4 ${
                        link.highlight
                          ? theme === "dark"
                            ? "font-medium text-white/50 hover:text-white/80"
                            : "font-medium text-gray-600 hover:text-gray-900"
                          : theme === "dark"
                            ? "text-white/50 hover:text-[#C10000]"
                            : "text-gray-600 hover:text-[#C10000]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact & Hours */}
            <div className="space-y-3">
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-white/30" : "text-gray-900"}`}
              >
                Atendimento em FW
              </h4>
              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>
                    {storeInfo.address}
                    <br />
                    {storeInfo.city} - {storeInfo.state}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p>{storeInfo.businessHoursWeekday}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {storeInfo.businessHoursWeekend}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`tel:${storeInfo.phoneNumber}`} className="hover:text-[#C10000]">{storeInfo.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <a href={`https://wa.me/${storeInfo.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#C10000]">{storeInfo.whatsappDisplay}</a>
                </div>
              </div>
            </div>

          </div>

          {/* Payment Methods */}
          <div className="flex flex-col gap-4 border-t border-gray-100 py-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2
                className={`text-sm font-bold ${theme === "dark" ? "text-white/80" : "text-gray-900"}`}
              >
                Formas de pagamento
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Consulte as opções disponíveis no fechamento do pedido.
              </p>
            </div>

            <ul className="flex flex-wrap items-center gap-2.5">
              {paymentMethods.map((method) => (
                <li key={method.name} className="shrink-0">
                  <Image
                    src={method.src}
                    alt={method.name}
                    width={48}
                    height={32}
                    unoptimized
                    className={`h-8 w-12 object-contain ${theme === "dark" ? "opacity-60 grayscale invert transition hover:opacity-100 hover:grayscale-0" : ""}`}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Informações comerciais */}
        <div className="bg-neutral-100 text-neutral-600 border-y border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-[11px] leading-relaxed space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-neutral-800">
              <span>Supermercado Bertoletti</span>
              <span>·</span>
              <span>CNPJ: 92.559.343/0001-09</span>
              <span>·</span>
              <span>Frederico Westphalen - RS</span>
            </div>

            <p>
              <strong className="text-neutral-900">Informações da loja:</strong>{" "}
              Preços e disponibilidade dos produtos podem mudar sem aviso prévio.
              Consulte as condições vigentes no momento da compra.
            </p>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <p>
              © 2026 {storeInfo.name}. Todos os direitos reservados.
              Frederico Westphalen - RS.
            </p>
            <p className="flex items-center gap-1 text-[11px]">
              Qualidade e variedade pertinho de você
            </p>
          </div>
        </div>
      </div>
    </footer>
  );

  return theme === "dark" ? applyFooterTheme(content) : content;
}
