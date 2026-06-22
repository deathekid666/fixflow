import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

// Verify Stripe webhook signature using the stripe-signature header.
// Implements the same algorithm as stripe.webhooks.constructEvent without
// requiring the stripe npm package.
function verifyStripeSignature(body: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")));
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  // Reject events older than 5 minutes to prevent replay attacks
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return new Response("Stripe not configured", { status: 200 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!verifyStripeSignature(body, signature, webhookSecret)) {
    return new Response("Invalid signature", { status: 400 });
  }

  type StripeEvent = { type: string; data: { object: Record<string, unknown> & { id?: string; metadata?: Record<string, string>; customer?: string } } };
  let event: StripeEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

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
      console.warn("[BILLING] Payment failed for invoice", event.data.object.id);
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}
