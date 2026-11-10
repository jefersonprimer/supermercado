This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mercado Pago

O checkout usa o Checkout Pro via Orders API (`POST /v1/orders`). Configure estas variáveis no `.env.local` e no ambiente de deploy:

```env
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET="..."
NEXT_PUBLIC_SITE_URL="https://seu-dominio.com.br"
```

O Access Token e o segredo do webhook são usados apenas no servidor. Copie o token do ambiente desejado no painel do Mercado Pago. Para testar o Checkout Pro via Orders API, use os cartões de teste oficiais. No painel, configure Webhooks para o evento **Order (Mercado Pago)** no ambiente de teste e aponte para `https://seu-dominio.com.br/api/payments/mercadopago/webhook`; configure a URL e o segredo correspondentes também no ambiente de produção. Para testes locais, o checkout pode retornar ao localhost, mas o webhook precisa de uma URL HTTPS pública. Cada pedido local guarda o Order ID do Mercado Pago em `payment_order_id`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
