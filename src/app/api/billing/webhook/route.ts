import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/billing/webhook — Stripe webhook handler
// When STRIPE_WEBHOOK_SECRET and STRIPE_SECRET_KEY are configured, this
// processes real Stripe events. Until then it returns 200 to avoid Stripe retries.
export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    // Stripe not yet configured — acknowledge and skip
    return new Response("Stripe not configured", { status: 200 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  // TODO: Verify Stripe signature and parse event
  // const stripe = new Stripe(stripeSecret, { apiVersion: "2024-10-28.acacia" });
  // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  type StripeEvent = { type: string; data: { object: Record<string, unknown> & { id?: string; metadata?: Record<string, string>; customer?: string } } };
  let event: StripeEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Handle Stripe events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const shopId = session.metadata?.shopId as string | undefined;
      const plan = session.metadata?.plan as string | undefined;
      const customerId = session.customer as string | undefined;

      if (shopId && plan) {
        await prisma.shop.update({ where: { id: shopId }, data: { plan, status: "ACTIVE" } });
        if (customerId) {
          await prisma.shopSettings.upsert({
            where: { shopId },
            update: { stripeCustomerId: customerId, stripePlanSelected: plan },
            create: { shopId, stripeCustomerId: customerId, stripePlanSelected: plan },
          });
        }
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const shopId = sub.metadata?.shopId as string | undefined;
      if (shopId) {
        await prisma.shop.update({ where: { id: shopId }, data: { plan: "FREE" } });
      }
      break;
    }
    case "invoice.payment_failed": {
      // Log but don't downgrade immediately — Stripe retries
      console.warn("[BILLING] Payment failed for invoice", event.data.object.id);
      break;
    }
    default:
      // Unhandled event — acknowledge
      break;
  }

  return new Response("ok", { status: 200 });
}
