import Stripe from 'stripe';
import { buffer } from 'micro';
import prisma from '../../../lib/prisma';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const sig = req.headers['stripe-signature'];
  const raw = await buffer(req);
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stampId = session.metadata?.stampId;
    console.log('Payment succeeded for session:', session.id, 'stampId:', stampId);
    if (stampId) {
      // TODO: implement order table or mark stamp as sold, create transaction record
      await prisma.stamp.update({
        where: { id: Number(stampId) },
        data: { /* e.g. mark as sold */ }
      }).catch(e=>console.error(e));
    }
  }

  res.json({ received: true });
}