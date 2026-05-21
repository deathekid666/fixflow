// src/app/api/csv/import/route.ts
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

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.replace(/\r/g, ""));
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

async function importSpareParts(
  rows: Record<string, string>[],
  shopId: string
): Promise<ImportResult> {
  const result: ImportResult = { totalRows: rows.length, imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed + header

    if (!row["name"]?.trim()) {
      result.errors.push({ row: rowNum, data: row, reason: "Missing required field: name" });
      result.skipped++;
      continue;
    }

    const unitPrice = parseFloat(row["unit_price"] ?? row["unitprice"] ?? "0");
    const stock = parseInt(row["stock"] ?? "0", 10);

    if (isNaN(unitPrice)) {
      result.errors.push({ row: rowNum, data: row, reason: "unit_price must be a number" });
      result.skipped++;
      continue;
    }

    try {
      // Upsert by partNumber if provided, otherwise always insert
      const partNumber = row["part_number"]?.trim() || row["partnumber"]?.trim() || null;

      if (partNumber) {
        const existing = await prisma.sparePart.findFirst({
          where: { partNumber, shopId },
        });
        if (existing) {
          await prisma.sparePart.update({
            where: { id: existing.id },
            data: { name: row["name"].trim(), unitPrice, stock: isNaN(stock) ? 0 : stock },
          });
        } else {
          await prisma.sparePart.create({
            data: {
              name: row["name"].trim(),
              partNumber,
              description: row["description"]?.trim() || null,
              unitPrice,
              stock: isNaN(stock) ? 0 : stock,
              shopId,
            },
          });
        }
      } else {
        await prisma.sparePart.create({
          data: {
            name: row["name"].trim(),
            description: row["description"]?.trim() || null,
            unitPrice,
            stock: isNaN(stock) ? 0 : stock,
            shopId,
          },
        });
      }
      result.imported++;
    } catch (err: unknown) {
      result.errors.push({
        row: rowNum,
        data: row,
        reason: err instanceof Error ? err.message : "Database error",
      });
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
  // Customers in FixFlow are embedded in WorkOrders (no separate Customer table).
  // This import creates minimal work orders as customer records with status RECEIVED.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const name = row["name"]?.trim() || row["customer_name"]?.trim();
    const phone = row["phone"]?.trim() || row["customer_phone"]?.trim();

    if (!name || !phone) {
      result.errors.push({ row: rowNum, data: row, reason: "name and phone are required" });
      result.skipped++;
      continue;
    }

    // Skip if phone already has an order in this shop (dedup)
    const existing = await prisma.workOrder.findFirst({
      where: { customerPhone: phone, shopId },
    });
    if (existing) {
      result.errors.push({
        row: rowNum,
        data: row,
        reason: `Customer with phone ${phone} already exists`,
      });
      result.skipped++;
      continue;
    }

    try {
      // We need a userId — use the first ADMIN of the shop as the creator
      const admin = await prisma.user.findFirst({ where: { shopId, role: "ADMIN" } });
      if (!admin) {
        result.errors.push({ row: rowNum, data: row, reason: "No admin found for this shop" });
        result.skipped++;
        continue;
      }

      await prisma.workOrder.create({
        data: {
          customerName: name,
          customerPhone: phone,
          customerEmail: row["email"]?.trim() || null,
          deviceBrand: row["device_brand"]?.trim() || "Unknown",
          deviceModel: row["device_model"]?.trim() || "Unknown",
          faultDescription: row["fault_description"]?.trim() || "Imported via CSV",
          shopId,
          userId: admin.id,
          status: "RECEIVED",
        },
      });
      result.imported++;
    } catch (err: unknown) {
      result.errors.push({
        row: rowNum,
        data: row,
        reason: err instanceof Error ? err.message : "Database error",
      });
      result.skipped++;
    }
  }

  return result;
}

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.shopId) return Response.json({ error: "No shop assigned" }, { status: 400 });

  let type: string | null = null;
  let csvText = "";

  try {
    const formData = await req.formData();
    type = formData.get("type") as string;
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "No file provided" }, { status: 400 });
    csvText = await file.text();
  } catch {
    return Response.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  if (!type || !["spareparts", "customers"].includes(type)) {
    return Response.json(
      { error: 'type must be "spareparts" or "customers"' },
      { status: 400 }
    );
  }

  if (!csvText.trim()) {
    return Response.json({ error: "CSV file is empty" }, { status: 400 });
  }

  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return Response.json({ error: "No data rows found in CSV" }, { status: 400 });
  }

  const result =
    type === "spareparts"
      ? await importSpareParts(rows, user.shopId)
      : await importCustomers(rows, user.shopId);

  return Response.json(result);
}
