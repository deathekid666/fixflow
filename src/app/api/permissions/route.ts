import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { PERMISSIONS, ENGINEER_DEFAULTS, resolvePerms, bustPermCache, type Permission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// GET — return resolved permissions for every role in this shop
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Admins only" }, { status: 403 });

  const engineerPerms = await resolvePerms(user.shopId, "ENGINEER");
  return Response.json({ ENGINEER: engineerPerms });
}

// PUT — upsert one permission toggle
export async function PUT(req: Request) {
  const user = requireAuth(req);
  if (!user || !user.shopId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Admins only" }, { status: 403 });

  const { role, permission, enabled } = await req.json();

  if (!role || !permission || typeof enabled !== "boolean") {
    return Response.json({ error: "role, permission, enabled required" }, { status: 400 });
  }
  if (!PERMISSIONS.includes(permission as Permission)) {
    return Response.json({ error: "Unknown permission" }, { status: 400 });
  }

  await prisma.rolePermission.upsert({
    where: { shopId_role_permission: { shopId: user.shopId, role, permission } },
    create: { shopId: user.shopId, role, permission, enabled },
    update: { enabled },
  });

  bustPermCache(user.shopId, role);
  return Response.json({ ok: true });
}
