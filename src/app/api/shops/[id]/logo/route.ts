import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  let url: string;
  try {
    const blob = await put(`shops/${params.id}/logo-${Date.now()}`, file, {
      access: "public", contentType: file.type,
    });
    url = blob.url;
  } catch {
    const buffer = Buffer.from(await file.arrayBuffer());
    url = `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  await prisma.shop.update({
    where: { id: params.id },
    data: { logoUrl: url },
  });

  return NextResponse.json({ url });
}