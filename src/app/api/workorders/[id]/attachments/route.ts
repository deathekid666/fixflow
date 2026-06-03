import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"];

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attachments = await prisma.workOrderAttachment.findMany({
    where: { workOrderId: params.id },
    select: { id: true, filename: true, path: true, tag: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const order = await prisma.workOrder.findFirst({
    where: { id: params.id, shopId: user.shopId ?? undefined },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tag = (formData.get("tag") as string) || "other";

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "File type not allowed" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const attachment = await prisma.workOrderAttachment.create({
    data: {
      filename: file.name,
      path: base64,
      tag,
      workOrderId: params.id,
    },
  });

  await prisma.operationLog.create({
    data: {
      action: "ATTACHMENT_ADDED",
      description: `File uploaded: ${file.name} [${tag}]`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return NextResponse.json({
    id: attachment.id,
    filename: attachment.filename,
    path: attachment.path,
    tag: attachment.tag,
    createdAt: attachment.createdAt,
  }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { attachmentId } = await req.json();
  if (!attachmentId) return NextResponse.json({ error: "attachmentId required" }, { status: 400 });

  const attachment = await prisma.workOrderAttachment.findFirst({
    where: { id: attachmentId, workOrderId: params.id },
  });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.workOrderAttachment.delete({ where: { id: attachmentId } });

  await prisma.operationLog.create({
    data: {
      action: "ATTACHMENT_DELETED",
      description: `File deleted: ${attachment.filename}`,
      workOrderId: params.id,
      userId: user.id,
    },
  });

  return NextResponse.json({ message: "Deleted" });
}