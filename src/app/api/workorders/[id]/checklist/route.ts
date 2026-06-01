import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const DEFAULT_CHECKLIST = [
  "Screen — cracks, dead pixels, touch response",
  "Battery — health, swelling, charging",
  "Buttons — power, volume, home",
  "Ports — charging, headphone, SIM tray",
  "Speakers & Microphone",
  "Cameras — front and rear",
  "WiFi & Bluetooth",
  "Cellular signal",
  "Face ID / Fingerprint",
  "Water damage indicators",
];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let checks = await prisma.diagnosisCheck.findMany({
    where: { workOrderId: params.id },
    orderBy: { createdAt: "asc" },
  });

  if (checks.length === 0) {
    await prisma.diagnosisCheck.createMany({
      data: DEFAULT_CHECKLIST.map(item => ({
        workOrderId: params.id,
        item,
        status: "PENDING",
      })),
    });
    checks = await prisma.diagnosisCheck.findMany({
      where: { workOrderId: params.id },
      orderBy: { createdAt: "asc" },
    });
  }

  return Response.json(checks);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { checkId, status, note } = await req.json();
  if (!checkId || !status) return Response.json({ error: "checkId and status required" }, { status: 400 });

  const updated = await prisma.diagnosisCheck.update({
    where: { id: checkId },
    data: { status, note: note ?? undefined, checkedBy: user.id, updatedAt: new Date() },
  });

  return Response.json(updated);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { item } = await req.json();
  if (!item) return Response.json({ error: "item required" }, { status: 400 });

  const check = await prisma.diagnosisCheck.create({
    data: { workOrderId: params.id, item, status: "PENDING" },
  });

  return Response.json(check, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { checkId } = await req.json();
  await prisma.diagnosisCheck.delete({ where: { id: checkId } });
  return Response.json({ message: "Deleted" });
}