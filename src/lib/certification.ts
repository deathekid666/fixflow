import { prisma } from "./prisma";
import { createNotification, getShopAdminIds } from "./notifications";

export type CertLevel = "BRONZE" | "SILVER" | "GOLD";

export const CERT_CRITERIA = {
  BRONZE: { minOrders: 10,  minRating: 3.5, maxBounceRate: null },
  SILVER: { minOrders: 50,  minRating: 4.0, maxBounceRate: null },
  GOLD:   { minOrders: 200, minRating: 4.5, maxBounceRate: 5 },
} as const;

export const CERT_META: Record<CertLevel, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  BRONZE: { label: "Bronze",  color: "#92400e", bg: "#fef3c7", border: "#d97706", emoji: "🥉" },
  SILVER: { label: "Silver",  color: "#374151", bg: "#f1f5f9", border: "#94a3b8", emoji: "🥈" },
  GOLD:   { label: "Gold",    color: "#713f12", bg: "#fef9c3", border: "#ca8a04", emoji: "🥇" },
};

export async function recalculateCertification(shopId: string): Promise<CertLevel | null> {
  const orders = await prisma.workOrder.findMany({
    where: { shopId, deletedAt: null },
    select: {
      status: true,
      bounceCount: true,
      rating: { select: { rating: true } },
    },
  });

  const completed = orders.filter((o) => o.status === "DELIVERED");
  const totalCompleted = completed.length;

  const rated = completed.filter((o) => o.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, o) => sum + (o.rating?.rating ?? 0), 0) / rated.length
      : 0;

  const bouncedCount = completed.filter((o) => (o.bounceCount ?? 0) > 0).length;
  const bounceRate = totalCompleted > 0 ? (bouncedCount / totalCompleted) * 100 : 0;

  let level: CertLevel | null = null;

  if (
    totalCompleted >= CERT_CRITERIA.GOLD.minOrders &&
    avgRating >= CERT_CRITERIA.GOLD.minRating &&
    bounceRate <= CERT_CRITERIA.GOLD.maxBounceRate!
  ) {
    level = "GOLD";
  } else if (
    totalCompleted >= CERT_CRITERIA.SILVER.minOrders &&
    avgRating >= CERT_CRITERIA.SILVER.minRating
  ) {
    level = "SILVER";
  } else if (
    totalCompleted >= CERT_CRITERIA.BRONZE.minOrders &&
    avgRating >= CERT_CRITERIA.BRONZE.minRating
  ) {
    level = "BRONZE";
  }

  if (level) {
    const existing = await prisma.certification.findUnique({ where: { shopId } });
    await prisma.certification.upsert({
      where: { shopId },
      create: { shopId, level, earnedAt: new Date() },
      update: { level, updatedAt: new Date() },
    });
    await prisma.shop.update({ where: { id: shopId }, data: { certification: level } });
    // Notify admins only when level actually changes or is newly earned
    if (!existing || existing.level !== level) {
      const meta = CERT_META[level];
      const adminIds = await getShopAdminIds(shopId);
      await Promise.all(
        adminIds.map((uid) =>
          createNotification(uid, "CERTIFICATION", `${meta.emoji} ${meta.label} certification achieved!`, {
            link: "/dashboard/certification",
          })
        )
      );
    }
  } else {
    // Remove cert if no longer qualifies
    await prisma.certification.deleteMany({ where: { shopId } });
    await prisma.shop.update({ where: { id: shopId }, data: { certification: null } });
  }

  return level;
}

export async function getShopCertStats(shopId: string) {
  const orders = await prisma.workOrder.findMany({
    where: { shopId, deletedAt: null },
    select: {
      status: true,
      bounceCount: true,
      rating: { select: { rating: true } },
    },
  });

  const completed = orders.filter((o) => o.status === "DELIVERED");
  const totalCompleted = completed.length;
  const rated = completed.filter((o) => o.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, o) => sum + (o.rating?.rating ?? 0), 0) / rated.length
      : 0;
  const bouncedCount = completed.filter((o) => (o.bounceCount ?? 0) > 0).length;
  const bounceRate = totalCompleted > 0 ? (bouncedCount / totalCompleted) * 100 : 0;

  const cert = await prisma.certification.findUnique({ where: { shopId } });

  return {
    totalCompleted,
    avgRating: Math.round(avgRating * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    currentLevel: (cert?.level as CertLevel | null) ?? null,
    earnedAt: cert?.earnedAt ?? null,
  };
}
