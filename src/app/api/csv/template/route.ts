// src/app/api/csv/template/route.ts
import { requireAuth } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

const TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  spareparts: {
    headers: ["name", "part_number", "description", "unit_price", "stock"],
    example: ["Écran LCD iPhone 13", "SCR-IP13-001", "Remplacement écran complet", "450", "5"],
  },
  customers: {
    headers: ["name", "phone", "email", "device_brand", "device_model", "fault_description"],
    example: ["Ahmed Benali", "+212600000001", "ahmed@email.com", "Samsung", "Galaxy S22", "Écran cassé"],
  },
};

export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type || !TEMPLATES[type]) {
    return Response.json(
      { error: 'type must be "spareparts" or "customers"' },
      { status: 400 }
    );
  }

  const { headers, example } = TEMPLATES[type];
  const csv = [headers.join(","), example.join(",")].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${type}_template.csv"`,
    },
  });
}
