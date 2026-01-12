import fetch from 'node-fetch';
import prisma from '../../../lib/prisma';

const PAYPAL_API = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const j = await res.json();
  return j.access_token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { stampId } = req.body;
  const stamp = await prisma.stamp.findUnique({ where: { id: Number(stampId) } });
  if (!stamp) return res.status(404).json({ error: 'Stamp not found' });

  const accessToken = await getAccessToken();
  const orderRes = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: ((stamp.price||0)/100).toFixed(2) },
        description: stamp.title
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?paypal=success&stamp=${stamp.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/stamps/${stamp.id}?paypal=cancel`
      }
    })
  });
  const data = await orderRes.json();
  const approve = data.links?.find(l => l.rel === 'approve')?.href;
  res.json({ order: data, approveUrl: approve });
}