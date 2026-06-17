import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { validateImei } from "@/lib/imei";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const imei: string = (body.imei ?? "").replace(/\s+/g, "").replace(/-/g, "");

  if (!imei) return Response.json({ error: "imei is required" }, { status: 400 });

  const local = validateImei(imei);

  // Try imeicheck.net if the shop has configured an API key
  let blacklist: { status: string; info: string | null } | null = null;
  let proError: string | null = null;

  if (user.shopId && local.format) {
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId: user.shopId },
      select: { imeiProApiKey: true },
    });

    if (settings?.imeiProApiKey) {
      try {
        const res = await fetch("https://api.imeicheck.net/api/checks", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${settings.imeiProApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId: imei, serviceId: 1 }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data = await res.json();
          // imeicheck.net returns properties.status or properties.blacklist
          const props = data?.properties ?? data?.result ?? {};
          const blacklisted = props.blacklist === true || props.status === "BLACKLISTED"
            || String(props.blacklist ?? "").toLowerCase() === "blacklisted"
            || String(props.simlock ?? "").toLowerCase().includes("blacklisted");
          const statusStr = blacklisted
            ? "BLACKLISTED"
            : (props.blacklist === false || props.status === "CLEAN" ? "CLEAN" : "UNKNOWN");
          blacklist = {
            status: statusStr,
            info: props.modelName ?? props.deviceName ?? props.brand ?? null,
          };
        } else {
          proError = res.status === 401 ? "Invalid IMEI Pro API key" : `API error ${res.status}`;
        }
      } catch (e: unknown) {
        proError = e instanceof Error && e.name === "TimeoutError" ? "IMEI Pro API timed out" : "IMEI Pro API unavailable";
      }
    }
  }

  return Response.json({ ...local, blacklist, proError });
}
