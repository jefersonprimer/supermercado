import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { withProductPromotions } from "@/lib/promotions-server";
import { CreateProductInput } from "@/types/product";

// GET /api/products?search=...&category=...&department=...&brand=...&limit=20&offset=0
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const department = searchParams.get("department");
    const brand = searchParams.get("brand");
    const suggestions = searchParams.get("suggestions") === "1";

    const parsedLimit = searchParams.get("limit")
      ? Number.parseInt(searchParams.get("limit") as string, 10)
      : null;
    const limit =
      parsedLimit !== null && Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : null;
    const parsedOffset = searchParams.get("offset")
      ? Number.parseInt(searchParams.get("offset") as string, 10)
      : 0;
    const offset = Number.isFinite(parsedOffset) && parsedOffset > 0
      ? parsedOffset
      : 0;

    const filters = ["1=1"];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      filters.push(
        `(name ILIKE $${params.length} OR description ILIKE $${params.length} OR brand ILIKE $${params.length})`
      );
    }

    if (category) {
      params.push(category);
      filters.push(`category = $${params.length}`);
    }

    if (department) {
      params.push(department);
      filters.push(`department = $${params.length}`);
    }

    if (brand) {
      params.push(brand);
      filters.push(`brand = $${params.length}`);
    }

    const whereClause = filters.join(" AND ");

    const selectSql = `
      SELECT
        id,
        name,
        slug,
        department,
        category,
        subcategory,
        brand,
        COALESCE(images, ARRAY[image_url]) as images,
        COALESCE(options, '[]'::jsonb) as options,
        description,
        COALESCE(specifications, '{}'::jsonb) as specifications,
        price,
        original_price,
        installment_price,
        COALESCE(installments, 3) as installments,
        stock,
        is_featured,
        is_new,
        created_at,
        updated_at
      FROM public.products
      WHERE ${whereClause}
      ORDER BY created_at DESC, id DESC
    `;

    if (limit !== null) {
      const rows = await query(
        `${selectSql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit + 1, offset]
      );
      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;

      const countRows = suggestions
        ? null
        : await query<{ count: number }>(
            `SELECT COUNT(*)::int AS count FROM public.products WHERE ${whereClause}`,
            params
          );

      const productsWithPromotions = await withProductPromotions(pageRows);

      return NextResponse.json({
        products: productsWithPromotions,
        total: countRows ? Number(countRows[0]?.count ?? pageRows.length) : null,
        hasMore,
      });
    }

    const products = await query(selectSql, params);
    const productsWithPromotions = await withProductPromotions(products);

    return NextResponse.json({
      products: productsWithPromotions,
      total: products.length,
      hasMore: false,
    });
  } catch (error: any) {
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos no banco de dados." },
      { status: 500 }
    );
  }
}

// POST /api/products - Salva novo produto com todas as especificações
export async function POST(request: Request) {
  try {
    const body: CreateProductInput = await request.json();
    const {
      name,
      slug,
      department,
      category,
      subcategory,
      brand,
      images = [],
      options = [],
      description = "",
      specifications = {},
      price,
      original_price,
      installment_price,
      installments = 3,
      stock = 100,
      is_featured = false,
      is_new = false,
    } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios." },
        { status: 400 }
      );
    }

    // Gerar slug amigável
    const productSlug =
      slug ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();

    // Primeira imagem para compatibilidade retroativa com image_url legado
    const mainImageUrl = images.length > 0 ? images[0] : "";

    const result = await query(
      `INSERT INTO public.products (
        name,
        slug,
        department,
        category,
        subcategory,
        brand,
        images,
        image_url,
        options,
        description,
        specifications,
        price,
        original_price,
        installment_price,
        installments,
        stock,
        is_featured,
        is_new
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        name,
        productSlug,
        department || "Medicamentos",
        category || "Geral",
        subcategory || "",
        brand || "",
        images,
        mainImageUrl,
        JSON.stringify(options),
        description,
        JSON.stringify(specifications),
        parseFloat(String(price)),
        original_price ? parseFloat(String(original_price)) : null,
        installment_price ? parseFloat(String(installment_price)) : null,
        parseInt(String(installments), 10) || 3,
        parseInt(String(stock), 10) || 100,
        Boolean(is_featured),
        Boolean(is_new),
      ]
    );

    return NextResponse.json(
      { message: "Produto cadastrado com sucesso!", product: result[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao salvar produto:", error);
    return NextResponse.json(
      { error: "Erro ao salvar produto no banco de dados." },
      { status: 500 }
    );
  }
}
