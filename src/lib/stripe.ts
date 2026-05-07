export const STRIPE_PLANS = {
  plus: {
    name: 'Axiom Plus',
    priceId: 'price_1TUbF7GSON2VmEJyyJTltUI9',
    price: '$26.99',
    limit: 100,
  },
  pro: {
    name: 'Axiom Pro',
    priceId: 'price_1TUbFVGSON2VmEJyCKKutXSc',
    price: '$49.99',
    limit: -1, // unlimited
  },
  elite: {
    name: 'Research Elite',
    priceId: 'price_1TUbGIGSON2VmEJyyN6Z4JkB',
    price: '$69.99',
    limit: -1, // unlimited
  },
};

export async function createCheckoutSession(priceId: string, userEmail: string): Promise<void> {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured.');
  }

  const { loadStripe } = await import('@stripe/stripe-js');
  const stripe = await loadStripe(publishableKey);
  if (!stripe) throw new Error('Failed to load Stripe.');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'payment_method_types[]': 'card',
      'mode': 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      'customer_email': userEmail,
      'success_url': `${window.location.origin}/dashboard?upgraded=true`,
      'cancel_url': `${window.location.origin}/pricing`,
    }),
  });

  const session = await response.json();
  if (session.error) throw new Error(session.error.message);

  await stripe.redirectToCheckout({ sessionId: session.id });
}
