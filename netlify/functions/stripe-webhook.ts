import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  if (!sig) return { statusCode: 400, body: 'Missing stripe-signature' };

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.CheckoutSession;
    const userId = session.metadata?.userId;
    const subscriptionId = session.subscription as string;

    if (userId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0].price.id;

      let plan = 'plus';
      if (priceId === 'price_1TUbFVGSON2VmEJyCKKutXSc') plan = 'pro';
      if (priceId === 'price_1TUbGIGSON2VmEJyyN6Z4JkB') plan = 'elite';

      await db.collection('users').doc(userId).set({
        isPro: true,
        plan,
        subscriptionId,
        subscribedAt: new Date().toISOString(),
        solveLimit: plan === 'plus' ? 100 : -1,
      }, { merge: true });
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) {
      await db.collection('users').doc(userId).set({
        isPro: false,
        plan: 'free',
        solveLimit: 5,
      }, { merge: true });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
