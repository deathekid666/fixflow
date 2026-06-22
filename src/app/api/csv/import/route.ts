import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

interface RowError {
  row: number;
  data: Record<string, string>;
  reason: string;
}

interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: RowError[];
}

// RFC 4180 CSV parser — handles quoted fields, embedded commas, escaped quotes
function parseCSV(text: string): Record<string, string>[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!clean) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += ch;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const lines = clean.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i]?.trim() ?? ""; });
    return row;
  });
}

// Apply column mapping: writes canonical field names into each row so import
// functions can find them regardless of what the CSV columns were named.
function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  if (!Object.keys(mapping).length) return rows;
  return rows.map(row => {
    const out: Record<string, string> = { ...row };
    for (const [canonicalKey, csvCol] of Object.entries(mapping)) {
      if (csvCol) out[canonicalKey] = row[csvCol.toLowerCase()] ?? "";
    }
    return out;
  });
}

async function importSpareParts(
  rows: Record<string, string>[],
  shopId: string
): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const name = row["name"]?.trim();
    if (!name) {
      result.errors.push({ row: rowNum, data: row, reason: "Name is required" });
      result.skipped++;
      continue;
    }

    const rawPrice = row["unit_price"]?.trim() || row["unitprice"]?.trim() || "";
    const unitPrice = parseFloat(rawPrice);
    if (!rawPrice || isNaN(unitPrice) || unitPrice < 0) {
      result.errors.push({ row: rowNum, data: row, reason: "Unit price must be a valid non-negative number" });
      result.skipped++;
      continue;
    }

    const rawStock = row["stock"]?.trim() || row["stock_qty"]?.trim() || "";
    const stock = parseInt(rawStock, 10);
    const partNumber = row["part_number"]?.trim() || row["partnumber"]?.trim() || null;
    const description = row["description"]?.trim() || null;

    try {
      if (partNumber) {
        const existing = await prisma.sparePart.findFirst({ where: { partNumber, shopId } });
        if (existing) {
          await prisma.sparePart.update({
            where: { id: existing.id },
            data: { name, unitPrice, stock: isNaN(stock) ? existing.stock : stock },
          });
        } else {
          await prisma.sparePart.create({
            data: { name, partNumber, description, unitPrice, stock: isNaN(stock) ? 0 : stock, shopId },
          });
        }
      } else {
        await prisma.sparePart.create({
          data: { name, description, unitPrice, stock: isNaN(stock) ? 0 : stock, shopId },
        });
      }
      result.imported++;
    } catch (err: unknown) {
      result.errors.push({ row: rowNum, data: row, reason: err instanceof Error ? err.message : "Database error" });
      result.skipped++;
    }
  }

  return result;
}

async function importCustomers(
  rows: Record<string, string>[],
  shopId: string
): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, imported: 0, skipped: 0, errors: [] };

  const admin = await prisma.user.findFirst({ where: { shopId, role: "ADMIN" } });
  if (!admin) {
    return {
      ...result,
      skipped: rows.length,
      errors: rows.map((data, i) => ({ row: i + 2, data, reason: "No admin user found for this shop" })),
    };
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const name = (row["name"] || row["customer_name"])?.trim();
    const phone = (row["phone"] || row["customer_phone"])?.trim();

    if (!name) {
      result.errors.push({ row: rowNum, data: row, reason: "Customer name is required" });
      result.skipped++;
      continue;
    }
    if (!phone) {
      result.errors.push({ row: rowNum, data: row, reason: "Phone number is required" });
      result.skipped++;
      continue;
    }

    const existing = await prisma.workOrder.findFirst({ where: { customerPhone: phone, shopId } });
    if (existing) {
      result.errors.push({ row: rowNum, data: row, reason: `Phone ${phone} already has a record in this shop` });
      result.skipped++;
      continue;
    }

    try {
      const year = new Date().getFullYear();
      const count = await prisma.workOrder.count({ where: { shopId } });
      const orderNumber = `wo-${year}-${String(count + 1).padStart(4, "0")}-${shopId.slice(0, 4)}`;
      const slaDeadline = new Date(Date.now() + 24 * 3600000);
      await prisma.workOrder.create({
        data: {
          orderNumber,
          customerName: name,
          customerPhone: phone,
          customerEmail: (row["email"] || row["customer_email"])?.trim() || null,
          deviceBrand: row["device_brand"]?.trim() || row["brand"]?.trim() || "Unknown",
          deviceModel: row["device_model"]?.trim() || row["model"]?.trim() || "Unknown",
          faultDescription: (row["fault_description"] || row["fault"] || row["description"])?.trim() || "Imported via CSV",
          shopId,
          userId: admin.id,
          status: "RECEIVED",
          slaDeadline,
        },
      });
      result.imported++;
    } catch (err: unknown) {
      result.errors.push({ row: rowNum, data: row, reason: err instanceof Error ? err.message : "Database error" });
      result.skipped++;
    }
  }

  return result;
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop assigned" }, { status: 400 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return Response.json({ error: "Failed to parse request body" }, { status: 400 });

  const type = formData.get("type") as string | null;
  const file = formData.get("file") as File | null;
  const mappingStr = formData.get("mapping") as string | null;

  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
  if (!type || !["spareparts", "customers"].includes(type)) {
    return Response.json({ error: 'type must be "spareparts" or "customers"' }, { status: 400 });
  }

  let csvText: string;
  try {
    csvText = await file.text();
  } catch {
    return Response.json({ error: "Failed to read uploaded file" }, { status: 400 });
  }
  if (!csvText.trim()) return Response.json({ error: "CSV file is empty" }, { status: 400 });

  let rows = parseCSV(csvText);
  if (rows.length === 0) return Response.json({ error: "No data rows found in CSV" }, { status: 400 });

  if (mappingStr) {
    try {
      const rawMapping = JSON.parse(mappingStr) as Record<string, string>;
      const mapping = Object.fromEntries(Object.entries(rawMapping).filter(([, v]) => v?.trim()));
      rows = applyMapping(rows, mapping);
    } catch { /* invalid mapping JSON — proceed without mapping */ }
  }

  const result = type === "spareparts"
    ? await importSpareParts(rows, user.shopId)
    : await importCustomers(rows, user.shopId);

  return Response.json(result);
}
