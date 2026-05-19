import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "workorders";

  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  let csv = "";

  if (type === "workorders") {
    const orders = await prisma.workOrder.findMany({
      where: shopFilter,
      include: {
        creator: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    csv = "Order Number,Customer,Phone,Device Brand,Device Model,Serial Number,Status,Fault Level,Total,Collected,Assigned To,Created At\n";
    for (const o of orders) {
      csv += `"${o.orderNumber.slice(0,8).toUpperCase()}","${o.customerName}","${o.customerPhone}","${o.deviceBrand}","${o.deviceModel}","${o.serialNumber ?? ""}","${o.status}","${o.faultLevel}","${o.total.toFixed(2)}","${o.collected.toFixed(2)}","${o.assignee?.name ?? ""}","${new Date(o.createdAt).toLocaleDateString()}"\n`;
    }
  } else if (type === "parts") {
    const parts = await prisma.sparePart.findMany({
      where: shopFilter,
      orderBy: { name: "asc" },
    });

    csv = "Name,Part Number,Description,Unit Price,Stock\n";
    for (const p of parts) {
      csv += `"${p.name}","${p.partNumber ?? ""}","${p.description ?? ""}","${p.unitPrice.toFixed(2)}","${p.stock}"\n`;
    }
  } else if (type === "customers") {
    const orders = await prisma.workOrder.findMany({
      where: shopFilter,
      select: { customerName: true, customerPhone: true, customerEmail: true, total: true, collected: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    // deduplicate by phone
    const map = new Map<string, { name: string; phone: string; email: string; orders: number; spent: number }>();
    for (const o of orders) {
      const ex = map.get(o.customerPhone);
      if (ex) { ex.orders++; ex.spent += o.total; }
      else map.set(o.customerPhone, { name: o.customerName, phone: o.customerPhone, email: o.customerEmail ?? "", orders: 1, spent: o.total });
    }

    csv = "Name,Phone,Email,Total Orders,Total Spent\n";
    for (const c of map.values()) {
      csv += `"${c.name}","${c.phone}","${c.email}","${c.orders}","${c.spent.toFixed(2)}"\n`;
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
