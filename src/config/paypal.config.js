const checkoutSdk = require('@paypal/checkout-server-sdk');

// Fail loudly at startup so we don't produce opaque 500s on the first payment request.
if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.error(
    '[PayPal] Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET in environment (.env). Payments will not work.'
  );
}

/**
 * Builds the PayPal environment (sandbox vs live) from PAYPAL_MODE.
 * The secret is read here on the server only and is NEVER exposed to the client.
 */
const buildEnvironment = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  return process.env.PAYPAL_MODE === 'live'
    ? new checkoutSdk.core.LiveEnvironment(clientId, clientSecret)
    : new checkoutSdk.core.SandboxEnvironment(clientId, clientSecret);
};

// A single shared HTTP client is enough; it is stateless and reads credentials per-call.
const client = new checkoutSdk.core.PayPalHttpClient(buildEnvironment());

module.exports = { client, checkoutSdk };
