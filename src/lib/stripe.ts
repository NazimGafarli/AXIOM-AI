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
    limit: -1,
  },
  elite: {
    name: 'Research Elite',
    priceId: 'price_1TUbGIGSON2VmEJyyN6Z4JkB',
    price: '$69.99',
    limit: -1,
  },
};

export async function createCheckoutSession(
  priceId: string,
  userEmail: string,
  userId: string
): Promise<void> {
  const response = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId, userEmail, userId }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe hosted checkout page
  window.location.href = data.url;
}
