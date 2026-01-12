import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { country, year, rare } = req.query;
    const where = {};
    if (country) where.country = country;
    if (year) where.year = Number(year);
    if (rare) where.isRare = rare === 'true';
    const stamps = await prisma.stamp.findMany({ where, orderBy: { createdAt: 'desc' } });
    const normalized = stamps.map(s => ({ ...s, images: s.images || [] }));
    res.json(normalized);
    return;
  }

  if (req.method === 'POST') {
    // Protected: requires Authorization: Bearer <token> (token contains user id)
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      const body = req.body;
      const created = await prisma.stamp.create({
        data: {
          title: body.title,
          country: body.country,
          year: body.year ? Number(body.year) : null,
          description: body.description,
          images: body.images || [],
          isRare: body.isRare || false,
          condition: body.condition || null,
          provenance: body.provenance || null,
          price: body.price ? Number(body.price) : 0,
          createdBy: payload.id
        }
      });
      res.status(201).json(created);
    } catch (e) {
      console.error(e);
      res.status(401).json({ error: 'Invalid token' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}