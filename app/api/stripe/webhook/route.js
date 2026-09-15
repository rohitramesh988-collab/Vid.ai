const { getStripe } = require("../../../../lib/stripe");
const { prisma } = require("../../../../lib/db");

async function POST(req) {
  const stripe = getStripe();
  if (!stripe) return Response.json({ error: "Stripe not configured" }, { status: 400 });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object;
    const customerId = checkoutSession.customer;
    const subscriptionId = checkoutSession.subscription;
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: { plan: "PRO", stripeSubscriptionId: subscriptionId },
    });
  }

  if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const isActive = subscription.status === "active" || subscription.status === "trialing";
    await prisma.user.updateMany({
      where: { stripeCustomerId: subscription.customer },
      data: { plan: isActive ? "PRO" : "FREE" },
    });
  }

  return Response.json({ received: true });
}

module.exports = { POST };
