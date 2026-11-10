import { randomUUID, createHash } from "node:crypto";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "O envio de fotos está indisponível no momento." }, { status: 503 });
  }

  const folder = "job-applications";
  const publicId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  const allowedFormats = "jpg,jpeg,png,webp";
  const overwrite = "false";
  const signature = createHash("sha1")
    .update(`allowed_formats=${allowedFormats}&folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    cloudName,
    apiKey,
    folder,
    publicId,
    timestamp,
    allowedFormats,
    overwrite,
    signature,
  });
}
