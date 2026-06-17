import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { checkPerm } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function esc(v: string | number | null | undefined): string {
  const s = String(v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!await checkPerm(user.shopId, user.role, "VIEW_REPORTS")) {
    return Response.json({ error: "Permission denied: VIEW_REPORTS" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "workorders";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const shopFilter = user.shopId ? { shopId: user.shopId } : {};

  // ─── date helpers ────────────────────────────────────────────────────────
  const fromDate = from ? new Date(from + "T00:00:00.000Z") : null;
  const toDate   = to   ? new Date(to   + "T23:59:59.999Z") : null;
  function dateRange(field: string) {
    const f: Record<string, Date> = {};
    if (fromDate) f.gte = fromDate;
    if (toDate)   f.lte = toDate;
    return Object.keys(f).length ? { [field]: f } : {};
  }

  let csv = "";
  let filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;

  // ─── existing types ──────────────────────────────────────────────────────
  if (type === "workorders") {
    const orders = await prisma.workOrder.findMany({
      where: { ...shopFilter, ...dateRange("createdAt") },
      include: { creator: { select: { name: true } }, assignee: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv = "Order Number,Customer,Phone,Device Brand,Device Model,Serial Number,Status,Fault Level,Total,Collected,Assigned To,Created At\n";
    for (const o of orders) {
      csv += `${esc(o.orderNumber.slice(0, 8).toUpperCase())},${esc(o.customerName)},${esc(o.customerPhone)},${esc(o.deviceBrand)},${esc(o.deviceModel)},${esc(o.serialNumber)},${esc(o.status)},${esc(o.faultLevel)},${esc(o.total.toFixed(2))},${esc(o.collected.toFixed(2))},${esc(o.assignee?.name)},${esc(fmtDate(o.createdAt))}\n`;
    }
  } else if (type === "parts") {
    const parts = await prisma.sparePart.findMany({ where: shopFilter, orderBy: { name: "asc" } });
    csv = "Name,Part Number,Description,Unit Price,Stock\n";
    for (const p of parts) {
      csv += `${esc(p.name)},${esc(p.partNumber)},${esc(p.description)},${esc(p.unitPrice.toFixed(2))},${esc(p.stock)}\n`;
    }
  } else if (type === "customers") {
    const orders = await prisma.workOrder.findMany({
      where: { ...shopFilter, ...dateRange("createdAt") },
      select: { customerName: true, customerPhone: true, customerEmail: true, total: true, collected: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    const map = new Map<string, { name: string; phone: string; email: string; orders: number; spent: number }>();
    for (const o of orders) {
      const ex = map.get(o.customerPhone);
      if (ex) { ex.orders++; ex.spent += o.total; }
      else map.set(o.customerPhone, { name: o.customerName, phone: o.customerPhone, email: o.customerEmail ?? "", orders: 1, spent: o.total });
    }
    csv = "Name,Phone,Email,Total Orders,Total Spent\n";
    for (const c of map.values()) {
      csv += `${esc(c.name)},${esc(c.phone)},${esc(c.email)},${esc(c.orders)},${esc(c.spent.toFixed(2))}\n`;
    }

  // ─── accounting exports ──────────────────────────────────────────────────
  } else if (type === "quickbooks" || type === "xero" || type === "all-transactions") {

    // Pull all three data sources in parallel
    const [payments, expenses, commissions] = await Promise.all([
      prisma.payment.findMany({
        where: { ...dateRange("createdAt"), workOrder: { shopId: user.shopId ?? undefined } },
        include: {
          workOrder: { select: { orderNumber: true, customerName: true, customerPhone: true, deviceBrand: true, deviceModel: true, taxRate: true } },
          collector: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.expense.findMany({
        where: { ...shopFilter, ...dateRange("date") },
        include: { user: { select: { name: true } } },
        orderBy: { date: "asc" },
      }),
      prisma.engineerCommission.findMany({
        where: { ...shopFilter, ...dateRange("createdAt") },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (type === "quickbooks") {
      filename = `quickbooks-${new Date().toISOString().slice(0, 10)}.csv`;
      csv = "Date,Type,Num,Name,Description,Amount,Tax,Total\n";

      for (const p of payments) {
        const wo = p.workOrder;
        const taxRate = wo?.taxRate ?? 0;
        const gross = p.amount;
        const tax = taxRate > 0 ? parseFloat((gross - gross / (1 + taxRate / 100)).toFixed(2)) : 0;
        const net = parseFloat((gross - tax).toFixed(2));
        const desc = `Repair - ${wo?.deviceBrand ?? ""} ${wo?.deviceModel ?? ""}`.trim();
        const num = wo ? wo.orderNumber.slice(0, 8).toUpperCase() : "";
        csv += `${esc(fmtDate(p.createdAt))},${esc("Payment")},${esc(num)},${esc(wo?.customerName)},${esc(desc)},${esc(net.toFixed(2))},${esc(tax.toFixed(2))},${esc(gross.toFixed(2))}\n`;
      }
      for (const e of expenses) {
        csv += `${esc(fmtDate(e.date))},${esc("Expense")},${esc("")},${esc(e.user.name)},${esc(e.title)},${esc(e.amount.toFixed(2))},${esc("0.00")},${esc(e.amount.toFixed(2))}\n`;
      }
      for (const c of commissions) {
        csv += `${esc(fmtDate(c.createdAt))},${esc("Commission")},${esc("")},${esc(c.user.name)},${esc("Commission " + c.month)},${esc(c.commissionAmount.toFixed(2))},${esc("0.00")},${esc(c.commissionAmount.toFixed(2))}\n`;
      }

    } else if (type === "xero") {
      filename = `xero-${new Date().toISOString().slice(0, 10)}.csv`;
      csv = "*ContactName,*InvoiceNumber,*InvoiceDate,*DueDate,Description,*Quantity,*UnitAmount,*TaxType,*AccountCode\n";

      for (const p of payments) {
        const wo = p.workOrder;
        const taxRate = wo?.taxRate ?? 0;
        const gross = p.amount;
        const net = taxRate > 0 ? parseFloat((gross / (1 + taxRate / 100)).toFixed(2)) : gross;
        const taxType = taxRate > 0 ? "OUTPUT" : "NONE";
        const desc = `Repair - ${wo?.deviceBrand ?? ""} ${wo?.deviceModel ?? ""}`.trim();
        const num = wo ? wo.orderNumber.slice(0, 8).toUpperCase() : `PAY-${p.id.slice(0, 6)}`;
        csv += `${esc(wo?.customerName)},${esc(num)},${esc(fmtDate(p.createdAt))},${esc(fmtDate(p.createdAt))},${esc(desc)},${esc("1")},${esc(net.toFixed(2))},${esc(taxType)},${esc("200")}\n`;
      }
      for (const e of expenses) {
        csv += `${esc(e.user.name)},${esc("EXP-" + e.id.slice(0, 6).toUpperCase())},${esc(fmtDate(e.date))},${esc(fmtDate(e.date))},${esc(e.title)},${esc("1")},${esc(e.amount.toFixed(2))},${esc("NONE")},${esc("400")}\n`;
      }
      for (const c of commissions) {
        csv += `${esc(c.user.name)},${esc("COM-" + c.id.slice(0, 6).toUpperCase())},${esc(fmtDate(c.createdAt))},${esc(fmtDate(c.createdAt))},${esc("Commission " + c.month)},${esc("1")},${esc(c.commissionAmount.toFixed(2))},${esc("NONE")},${esc("477")}\n`;
      }

    } else {
      // all-transactions
      filename = `all-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      csv = "Date,Type,Reference,Party,Description,NetAmount,TaxAmount,GrossAmount,Method,Currency\n";

      const shopCurrency = (await prisma.shop.findUnique({ where: { id: user.shopId ?? "" }, select: { currency: true } }))?.currency ?? "MAD";

      for (const p of payments) {
        const wo = p.workOrder;
        const taxRate = wo?.taxRate ?? 0;
        const gross = p.amount;
        const tax = taxRate > 0 ? parseFloat((gross - gross / (1 + taxRate / 100)).toFixed(2)) : 0;
        const net = parseFloat((gross - tax).toFixed(2));
        const num = wo ? wo.orderNumber.slice(0, 8).toUpperCase() : "";
        const desc = `Repair - ${wo?.deviceBrand ?? ""} ${wo?.deviceModel ?? ""}`.trim();
        csv += `${esc(fmtDate(p.createdAt))},${esc("PAYMENT")},${esc(num)},${esc(wo?.customerName)},${esc(desc)},${esc(net.toFixed(2))},${esc(tax.toFixed(2))},${esc(gross.toFixed(2))},${esc(p.method)},${esc(shopCurrency)}\n`;
      }
      for (const e of expenses) {
        csv += `${esc(fmtDate(e.date))},${esc("EXPENSE")},${esc("")},${esc(e.user.name)},${esc(e.title)},${esc(e.amount.toFixed(2))},${esc("0.00")},${esc(e.amount.toFixed(2))},${esc(e.category)},${esc(shopCurrency)}\n`;
      }
      for (const c of commissions) {
        csv += `${esc(fmtDate(c.createdAt))},${esc("COMMISSION")},${esc("")},${esc(c.user.name)},${esc("Commission " + c.month)},${esc(c.commissionAmount.toFixed(2))},${esc("0.00")},${esc(c.commissionAmount.toFixed(2))},${esc("")},${esc(shopCurrency)}\n`;
      }
    }
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
