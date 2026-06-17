import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

// GET /api/billing — return current plan + Stripe status
export async function GET(req: Request) {
  const user = requireAuth(req);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { id: user.shopId! },
    select: { plan: true, status: true, trialEndsAt: true },
  });
  const settings = await prisma.shopSettings.findUnique({
    where: { shopId: user.shopId! },
    select: { stripePlanSelected: true, stripeCustomerId: true },
  });

  return Response.json({
    currentPlan: shop?.plan ?? "FREE",
    status: shop?.status ?? "TRIAL",
    trialEndsAt: shop?.trialEndsAt ?? null,
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    stripePlanSelected: settings?.stripePlanSelected ?? null,
    stripeCustomerId: settings?.stripeCustomerId ?? null,
    plans: PLANS,
  });
}

// POST /api/billing — initiate plan upgrade (Stripe checkout placeholder)
export async function POST(req: Request) {
  const user = requireAuth(req);
  if (!user || user.role !== "ADMIN") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  if (!["PRO", "ENTERPRISE"].includes(plan)) return Response.json({ error: "Invalid plan" }, { status: 400 });

  // Store the intended plan selection even before Stripe is wired
  await prisma.shopSettings.upsert({
    where: { shopId: user.shopId! },
    update: { stripePlanSelected: plan },
    create: { shopId: user.shopId!, stripePlanSelected: plan },
  });

  // TODO: When STRIPE_SECRET_KEY is set, create a Stripe checkout session here:
  // const session = await stripe.checkout.sessions.create({ ... });
  // return Response.json({ checkoutUrl: session.url });

  return Response.json({
    ok: true,
    message: "coming_soon",
    plan,
  });
}
