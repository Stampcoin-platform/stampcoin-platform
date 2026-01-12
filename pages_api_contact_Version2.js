import prisma from '../../lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { name, email, phone, message } = req.body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message are required' });

  try {
    const c = await prisma.contact.create({
      data: { name, email, phone, message }
    });
    // TODO: send notification email via SMTP if configured
    res.status(201).json({ ok: true, id: c.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}